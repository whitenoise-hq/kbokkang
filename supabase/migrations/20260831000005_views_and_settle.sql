-- 집계 뷰 + 정산 RPC
--
-- PostgREST 로는 GROUP BY 를 할 수 없어 어드민 통계/목록용 집계는 뷰로 제공한다.
-- 모든 뷰는 security_invoker = true — 조회하는 유저의 RLS 가 그대로 적용된다.
-- (기본값은 뷰 소유자 권한으로 동작해 RLS 를 우회하므로 반드시 명시해야 한다)

-- ─────────────────────────────────────────────────────────────
-- 1. user_summaries — 유저 목록 + 도감 진행률
-- ─────────────────────────────────────────────────────────────

create view public.user_summaries
with (security_invoker = true) as
select
  u.id,
  u.nickname,
  u.favorite_team_id,
  u.points,
  u.created_at,
  -- 보유 카드 종수. user_cards 는 (user_id, card_id) 유일하므로 count 로 충분하다
  coalesce(c.owned_card_kinds, 0)::int as owned_card_kinds
from public.users u
left join (
  select uc.user_id, count(*) as owned_card_kinds
  from public.user_cards uc
  join public.cards cd on cd.id = uc.card_id and cd.deleted_at is null
  group by uc.user_id
) c on c.user_id = u.id;

comment on view public.user_summaries is
  '유저 목록용. 도감 진행률(보유 종수)은 컬럼이 아니라 집계값이다. 삭제된 카드는 제외한다.';

-- ─────────────────────────────────────────────────────────────
-- 2. games_with_stats — 경기 목록 + 예측 분포
-- ─────────────────────────────────────────────────────────────

create view public.games_with_stats
with (security_invoker = true) as
select
  g.*,
  coalesce(p.prediction_count, 0)::int as prediction_count,
  coalesce(p.home_pick_count, 0)::int as home_pick_count
from public.games g
left join (
  select
    game_id,
    count(*) as prediction_count,
    count(*) filter (where pick_winner = 'home') as home_pick_count
  from public.predictions
  group by game_id
) p on p.game_id = g.id;

-- ─────────────────────────────────────────────────────────────
-- 3. card_spreads — 카드별 보유 현황 (통계)
-- ─────────────────────────────────────────────────────────────

create view public.card_spreads
with (security_invoker = true) as
select
  c.id as card_id,
  c.dex_no,
  c.name,
  c.grade,
  coalesce(o.owner_count, 0)::int as owner_count,
  -- 중복 포함 총 발급 장수
  coalesce(o.issued_count, 0)::int as issued_count
from public.cards c
left join (
  select card_id, count(*) as owner_count, sum(count) as issued_count
  from public.user_cards
  group by card_id
) o on o.card_id = c.id
where c.deleted_at is null;

comment on view public.card_spreads is
  '카드별 보유자 수와 발급 장수(중복 포함). owner_count = 0 이면 아무도 못 뽑은 카드다.';

-- ─────────────────────────────────────────────────────────────
-- 4. draw_grade_stats — 등급별 실제 뽑기 분포 (확률 검증)
-- ─────────────────────────────────────────────────────────────

create view public.draw_grade_stats
with (security_invoker = true) as
select
  d.draw_type,
  c.grade,
  count(*)::int as draw_count
from public.draws d
join public.cards c on c.id = d.card_id
group by d.draw_type, c.grade;

comment on view public.draw_grade_stats is
  '설정 확률(packages/shared 의 DRAW_GRADE_RATES)과 비교해 추첨 로직을 검증하는 데 쓴다.';

-- ─────────────────────────────────────────────────────────────
-- 5. point_flow_daily — 일별 포인트 유입/소비
-- ─────────────────────────────────────────────────────────────

create view public.point_flow_daily
with (security_invoker = true) as
select
  -- 집계 기준은 KST. UTC 로 묶으면 하루 경계가 9시간 밀린다
  (created_at at time zone 'Asia/Seoul')::date as flow_date,
  coalesce(sum(amount) filter (where amount > 0), 0)::int as issued,
  coalesce(sum(-amount) filter (where amount < 0), 0)::int as spent
from public.point_transactions
group by 1;

comment on view public.point_flow_daily is
  '일별 포인트 유입/소비. 집계 기준 시간대는 KST 다(UTC 로 묶으면 하루 경계가 9시간 밀린다).';

-- ─────────────────────────────────────────────────────────────
-- 6. 뷰 권한
-- ─────────────────────────────────────────────────────────────
-- security_invoker 라서 실제 접근 제어는 하위 테이블 RLS 가 한다.
-- 유저는 자기 행만, 운영자는 전체가 보인다.

grant select on public.user_summaries to authenticated;
grant select on public.games_with_stats to authenticated;
grant select on public.card_spreads to authenticated;
grant select on public.draw_grade_stats to authenticated;
grant select on public.point_flow_daily to authenticated;

grant select on public.user_summaries to service_role;
grant select on public.games_with_stats to service_role;
grant select on public.card_spreads to service_role;
grant select on public.draw_grade_stats to service_role;
grant select on public.point_flow_daily to service_role;

-- ─────────────────────────────────────────────────────────────
-- 7. settle_game — 정산 트랜잭션
-- ─────────────────────────────────────────────────────────────
-- 정산은 스코어 저장만으로 끝나지 않는다. 예측 결과 확정 → 포인트 지급 →
-- point_transactions 기록이 한 트랜잭션이어야 한다. 함수 하나가 곧 한 트랜잭션이다.
--
-- 자동 정산(크롤러)과 수동 정산(어드민)이 같은 함수를 쓴다 — 규칙이 두 곳에 갈라지지 않게.

create or replace function public.settle_game(
  target_game_id uuid,
  final_home_score int,
  final_away_score int
)
returns table (settled_predictions int, paid_points int)
language plpgsql
security definer
set search_path = ''
as $$
declare
  game_row public.games;
  home_won boolean;
  is_draw boolean;
  affected int := 0;
  total_points int := 0;
begin
  -- 행 잠금: 같은 경기를 동시에 정산하려는 요청을 직렬화한다
  select * into game_row from public.games where id = target_game_id for update;

  if not found then
    raise exception '경기를 찾을 수 없습니다: %', target_game_id;
  end if;

  if game_row.status = 'settled' then
    raise exception '이미 정산이 완료된 경기입니다';
  end if;

  if game_row.status = 'scheduled' then
    raise exception '아직 시작하지 않은 경기는 정산할 수 없습니다';
  end if;

  is_draw := final_home_score = final_away_score;
  home_won := final_home_score > final_away_score;

  -- 1) 경기 결과 확정
  update public.games
  set home_score = final_home_score,
      away_score = final_away_score,
      status = 'settled',
      settled_at = now()
  where id = target_game_id;

  -- 2) 예측 결과와 지급 포인트 확정
  --    무승부면 승패 예측은 모두 미적중으로 처리한다(홈/원정 둘 중 하나를 고르는 방식이므로).
  --    스코어 적중은 승패 적중을 포함하므로 중복 지급하지 않는다.
  update public.predictions p
  set result = case
        when is_draw then 'miss'::public.prediction_result
        when (p.pick_winner = 'home') <> home_won then 'miss'::public.prediction_result
        when p.pick_home_score = final_home_score and p.pick_away_score = final_away_score
          then 'score_hit'::public.prediction_result
        else 'win_hit'::public.prediction_result
      end,
      earned_points = case
        when is_draw then 0
        when (p.pick_winner = 'home') <> home_won then 0
        when p.pick_home_score = final_home_score and p.pick_away_score = final_away_score
          then 150
        else 30
      end
  where p.game_id = target_game_id and p.result = 'pending';

  get diagnostics affected = row_count;

  -- 3) 포인트 지급 + 내역 기록
  insert into public.point_transactions (user_id, amount, reason, ref_id)
  select
    p.user_id,
    p.earned_points,
    case when p.result = 'score_hit' then 'predict_score'::public.point_reason
         else 'predict_win'::public.point_reason end,
    p.id
  from public.predictions p
  where p.game_id = target_game_id and coalesce(p.earned_points, 0) > 0;

  update public.users u
  set points = u.points + agg.total
  from (
    select p.user_id, sum(p.earned_points) as total
    from public.predictions p
    where p.game_id = target_game_id and coalesce(p.earned_points, 0) > 0
    group by p.user_id
  ) agg
  where u.id = agg.user_id;

  select coalesce(sum(earned_points), 0) into total_points
  from public.predictions
  where game_id = target_game_id;

  return query select affected, total_points;
end;
$$;

comment on function public.settle_game(uuid, int, int) is
  '정산 트랜잭션. 경기 결과 확정 + 예측 결과/지급 포인트 확정 + 포인트 지급 + 내역 기록을 한 번에 처리한다. 자동(크롤러)·수동(어드민) 정산이 같은 함수를 쓴다.';

revoke all on function public.settle_game(uuid, int, int) from public;
grant execute on function public.settle_game(uuid, int, int) to service_role;
