-- pg_cron 체인 진단용 **임시** RPC
--
-- 09-03 경기가 전부 미정산으로 남았다. Vault·pg_net·함수 인증은 배포 직후 확인했으나
-- **pg_cron 스케줄러가 실제로 발화하는지는 확인하지 않았다.** 어디서 끊겼는지 본다.
-- 확인 후 삭제한다.

create or replace function public.crawler_diagnose()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'now_utc', now(),
    'db_timezone', current_setting('TimeZone'),
    'vault_has_key', exists(select 1 from vault.secrets where name = 'service_role_key'),
    'jobs', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'jobid', j.jobid, 'jobname', j.jobname, 'schedule', j.schedule,
               'active', j.active, 'username', j.username, 'database', j.database)), '[]'::jsonb)
        from cron.job as j
    ),
    'recent_runs', (
      select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select d.jobid, d.status, d.start_time, d.end_time, d.return_message
          from cron.job_run_details as d
         order by d.start_time desc
         limit 15
      ) as x
    ),
    'recent_http', (
      select coalesce(jsonb_agg(y), '[]'::jsonb) from (
        select r.id, r.status_code, r.error_msg, r.created
          from net._http_response as r
         order by r.created desc
         limit 15
      ) as y
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.crawler_diagnose() from public;
revoke all on function public.crawler_diagnose() from anon, authenticated;
grant execute on function public.crawler_diagnose() to service_role;
