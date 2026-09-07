-- 예측 마감을 경기 시작 **30분 전**으로 (기존 1시간 전)
--
-- ## 왜 바꾸는가
--
-- KBO 는 타순(라인업)을 경기 시작 1시간~1시간 30분 전에 발표한다. 마감이 1시간 전이면
-- **라인업을 보고 예측할 시간이 사실상 없다.** 30분 전으로 늦추면 라인업을 확인한 뒤
-- 예측할 수 있어 야구를 아는 유저에게 재미가 늘어난다.
--
-- ⚠️ 마감 검증은 세 곳에 있고 **모두 이 컬럼을 기준으로 한다** — 오프셋만 바꾸면 전부 따라온다:
--   1. 이 트리거(`predict_close_at` 계산)
--   2. `predictions_insert_own` RLS 정책 (`now() < g.predict_close_at`) — 서버 측 방어선
--   3. 앱의 `gamePhaseOf`(shared) — 화면 표시
--
-- ⚠️ `packages/shared` 의 `PREDICT_CLOSE_OFFSET_MINUTES` 도 함께 30 으로 바꿨다.
--    어드민 규칙 화면이 그 상수를 표시하므로 어긋나면 운영자가 잘못된 값을 본다.

create or replace function public.set_predict_close_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.predict_close_at := new.start_at - interval '30 minutes';
  return new;
end;
$$;

-- 이미 저장된 경기의 마감 시각을 다시 계산한다.
-- 트리거는 `update of start_at` 으로 한정돼 있어 이 UPDATE 를 덮어쓰지 않는다.
--
-- 지난 경기까지 함께 갱신한다 — 파생값이므로 값이 갈리면 나중에 혼란만 남는다.
-- 이미 정산된 경기의 예측 결과는 영향받지 않는다(결과는 확정된 상태로 저장돼 있다).
update public.games
set predict_close_at = start_at - interval '30 minutes'
where predict_close_at <> start_at - interval '30 minutes';
