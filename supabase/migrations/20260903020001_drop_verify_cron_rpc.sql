-- 검증용 임시 RPC 삭제
--
-- 20260903020000 은 배포 직후 체인(Vault → pg_net → Edge Function 인증 → 실제 작업)이
-- 이어지는지 한 번 확인하기 위한 것이었다. 확인됐으므로 지운다.
--
-- 다시 확인이 필요하면 SQL 에디터에서 직접 실행한다:
--   select jobname, schedule, active from cron.job;
--   select crawler.invoke('kbo-settle', '{"force":true}'::jsonb);
--   select * from net._http_response order by created desc limit 5;

drop function if exists public.crawler_verify();
