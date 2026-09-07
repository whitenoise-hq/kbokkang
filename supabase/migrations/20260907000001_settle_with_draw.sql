-- settle_game: 무승부 예측을 적중으로 인정
--
-- 기존: 무승부면 전원 미적중(`is_draw` 이면 전부 'miss', 0포인트).
-- 변경: **무승부를 고른 사람이 적중**한다. 3택(홈 / 무승부 / 원정)이 됐다.
--
-- 판정을 `pick_winner = 실제 결과` 한 줄로 단순화했다. 기존 코드는
-- `(pick_winner = 'home') <> home_won` 이라는 불리언 비교였는데, 선택지가 3개가 되면
-- 그 형태로는 표현할 수 없다(무승부 선택이 항상 miss 로 떨어진다).
--
-- 포인트는 승패 적중과 동일하게 30 이다 — 무승부를 맞히는 게 더 어렵다는 근거가 없고,
-- 값이 갈리면 포인트 경제(기획서 6장)를 다시 계산해야 한다.
--
-- 스코어 적중은 그대로 150 이며 승패 적중을 포함한다(중복 지급하지 않는다).
-- 무승부 경기에서 스코어까지 맞히면(예: 3:3 예측) score_hit 이다.

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
  actual public.prediction_pick;
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

  -- 실제 결과를 선택지와 같은 형태로 만든다. 이러면 판정이 단순 비교가 된다.
  actual := case
    when final_home_score > final_away_score then 'home'::public.prediction_pick
    when final_home_score < final_away_score then 'away'::public.prediction_pick
    else 'draw'::public.prediction_pick
  end;

  -- 1) 경기 결과 확정
  update public.games
  set home_score = final_home_score,
      away_score = final_away_score,
      status = 'settled',
      settled_at = now()
  where id = target_game_id;

  -- 2) 예측 결과와 지급 포인트 확정
  --    스코어 적중은 승패 적중을 포함하므로 중복 지급하지 않는다.
  update public.predictions p
  set result = case
        when p.pick_winner <> actual then 'miss'::public.prediction_result
        when p.pick_home_score = final_home_score and p.pick_away_score = final_away_score
          then 'score_hit'::public.prediction_result
        else 'win_hit'::public.prediction_result
      end,
      earned_points = case
        when p.pick_winner <> actual then 0
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
