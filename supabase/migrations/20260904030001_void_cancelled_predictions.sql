-- 취소 경기의 예측을 자동 무효 처리 + settle_game 에 취소 가드 추가
--
-- ## 왜 트리거인가
--
-- 취소 경기는 크롤러가 `status='settled'` + `cancelled=true` 로 **직접 upsert** 하고
-- `settle_game()` 을 호출하지 않는다. 그래서 그 경기의 예측이 `pending` 으로 남는다.
--
-- 무효 처리를 크롤러 코드에 두면 다른 경로(어드민 수동 처리 등)로 취소된 경기는 누락된다.
-- 이건 **데이터의 불변식**이므로 트리거로 강제한다.
--
-- 예측은 무료다(포인트를 걸지 않는다 — 통합기획서 6장). 따라서 환급은 없고
-- `earned_points = 0` 으로 마감한다.

create or replace function public.void_cancelled_predictions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.predictions
     set result = 'void'::public.prediction_result,
         earned_points = 0
   where game_id = new.id
     and result = 'pending'::public.prediction_result;

  return null;
end;
$$;

comment on function public.void_cancelled_predictions() is
  '취소 경기의 미처리 예측을 무효로 마감한다. 예측은 무료라 환급은 없다.';

drop trigger if exists games_void_predictions_on_cancel on public.games;

-- 반복 upsert 때마다 걸리지만 `result='pending'` 필터로 사실상 no-op 이다.
create trigger games_void_predictions_on_cancel
after insert or update on public.games
for each row
when (new.cancelled)
execute function public.void_cancelled_predictions();

-- ─────────────────────────────────────────────────────────────
-- settle_game: 취소 경기 정산 차단
-- ─────────────────────────────────────────────────────────────
--
-- 취소 경기는 status 가 이미 settled 라서 기존 가드에 걸리지만, 의미가 다른 거부
-- 메시지를 주는 편이 운영자에게 명확하다. 스코어가 없는 경기에 억지로 결과를
-- 넣는 것을 명시적으로 막는다.

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

  if game_row.cancelled then
    raise exception '취소된 경기는 정산할 수 없습니다';
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
