-- service_role 권한 부여
--
-- 프로젝트에서 "Automatically expose new tables" 를 껐기 때문에 새 테이블은 어떤 role 에도
-- 권한이 없는 상태로 만들어진다. service_role 은 RLS 를 우회하지만 **테이블 GRANT 는 여전히 필요**하다.
-- 이게 없으면 어드민의 권한 작업(도감번호 부여·정산·포인트 조정)과 크롤러가 전부 403 으로 실패한다.
--
-- 이 파일이 20260831000000_init_schema.sql 에 빠져 있어 뒤늦게 추가했다.
-- 앞으로 테이블을 추가할 때도 default privileges 로 자동 적용되게 함께 설정한다.

grant usage on schema public to service_role;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all functions in schema public to service_role;

-- 이후 postgres 가 만드는 객체에도 자동 적용 (마이그레이션은 postgres 로 실행된다)
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on functions to service_role;

-- anon 에는 아무 권한도 주지 않는다. 로그인 전에는 접근할 것이 없다.
-- (Storage 의 public 버킷 읽기는 storage.objects 정책으로 별도 처리됨)
