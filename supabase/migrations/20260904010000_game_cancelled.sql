-- 우천 취소 경기 표현 — `games.cancelled` 추가
--
-- ## 왜 필요한가 (실제 장애)
--
-- 2026-09-03 `20260903HTNC02026` 이 우천 취소되면서 그날 배치가 전부 실패했다.
-- 크롤러는 취소 경기를 `status = 'settled'`(더 이상 처리할 것 없음)로 넣는데 스코어는
-- 없다. 그런데 `games_settled_has_scores` 는 settled 면 스코어를 요구한다.
--
-- upsert 는 한 배치로 나가므로 **취소 경기 한 건이 그날 5경기 전체를 막았다.**
-- 정상 종료된 4경기도 정산되지 못했다.
--
-- ## 설계
--
-- 통합기획서 5장이 이미 정한 방향이다: "우천 취소는 우리 enum 에 없다. 정산 대상이 아니고
-- 예측도 무효여야 하므로 settled(더 이상 처리할 것 없음)로 두고, **취소 여부는 별도로
-- 표시한다**." 그 "별도 표시"가 구현되지 않아 생긴 문제이므로, 기획서대로 컬럼을 둔다.
--
-- enum 에 'cancelled' 를 추가하는 대안도 있으나, 그러면 기획서 결정을 뒤집고
-- 앱·어드민의 상태 처리를 모두 손봐야 한다. 취소는 "상태"가 아니라 "사유"에 가깝다.

alter table public.games
  add column if not exists cancelled boolean not null default false;

comment on column public.games.cancelled is
  '우천 등으로 취소된 경기. status 는 settled(처리 종료)이고 스코어는 없다. 예측은 무효 처리 대상.';

-- 제약 완화: 취소 경기만 스코어 없이 settled 가 될 수 있다.
-- 정상 경기는 여전히 스코어를 요구한다 — 정산 후 스코어가 비는 사고를 계속 막는다.
alter table public.games
  drop constraint if exists games_settled_has_scores;

alter table public.games
  add constraint games_settled_has_scores check (
    status <> 'settled' or cancelled or (home_score is not null and away_score is not null)
  );

-- 취소 경기는 스코어가 없어야 한다(0:0 으로 오는 소스 값을 그대로 넣지 않았는지 확인)
alter table public.games
  add constraint games_cancelled_has_no_scores check (
    not cancelled or (home_score is null and away_score is null)
  );

create index if not exists games_cancelled_idx on public.games (cancelled) where cancelled;
