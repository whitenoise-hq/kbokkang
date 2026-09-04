-- `prediction_result` 에 'void'(무효) 추가
--
-- 취소된 경기의 예측을 마감할 값이 없었다. 지금은 `pending` 으로 영구히 남아
-- 유저 화면에 "집계 중"이 영원히 표시된다.
--
-- ⚠️ enum 값 추가는 **그 값을 쓰는 마이그레이션과 분리**해야 한다.
--    같은 트랜잭션에서 추가하고 사용하면 Postgres 가 거부한다.
--
-- 예측은 무료다(포인트를 걸지 않는다) — 통합기획서 6장. 그래서 무효 처리에
-- 환급이 없고 `earned_points = 0` 으로 마감하면 끝이다.

alter type public.prediction_result add value if not exists 'void';
