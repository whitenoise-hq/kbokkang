-- 진단용 임시 RPC 삭제
--
-- 20260904000000 은 09-03 배치가 왜 실패했는지 찾기 위한 것이었다.
-- 원인: 우천 취소 경기가 games_settled_has_scores 제약을 위반해 upsert 배치 전체가 실패.
-- pg_cron 은 30분마다 정확히 발화하고 있었다(결번·지연 0).
--
-- 같은 진단이 다시 필요하면 SQL 에디터에서:
--   select jobname, schedule, active from cron.job;
--   select jobid, status, start_time, return_message from cron.job_run_details order by start_time desc limit 20;
--   select id, status_code, error_msg, created from net._http_response order by created desc limit 20;

drop function if exists public.crawler_diagnose();
