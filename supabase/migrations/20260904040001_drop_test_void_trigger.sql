-- 검증용 임시 RPC 삭제
--
-- 20260904040000 은 무효 트리거가 실제로 동작하는지 확인하기 위한 것이었다.
-- 결과: result=void, earned_points=0 (정상). 테스트 데이터는 예외로 전부 롤백됐다.
--
-- 앱(6단계)에서 실제 유저가 생기면 취소 경기 예측이 '무효'로 표시되는지 화면에서 재확인할 것.

drop function if exists public.crawler_test_void_trigger();
