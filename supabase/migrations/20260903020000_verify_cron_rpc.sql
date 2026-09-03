-- 체인 검증용 **임시** RPC (Vault 읽기 → pg_net → 함수 인증 → 실제 작업)
--
-- pg_cron 이 실제로 Edge Function 을 부를 수 있는지 배포 직후에 확인하기 위한 것.
-- 확인 후 다음 마이그레이션에서 삭제한다. service_role 만 호출 가능.

create or replace function public.crawler_verify()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  jobs jsonb;
  request_id bigint;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
           'jobname', j.jobname, 'schedule', j.schedule, 'active', j.active)), '[]'::jsonb)
    into jobs
    from cron.job as j
   where j.jobname in ('kbo-settle', 'kbo-schedule');

  -- crawler.invoke 를 직접 호출한다. Vault 에 키가 없으면 여기서 예외가 난다.
  select crawler.invoke('kbo-settle', '{"force":true}'::jsonb) into request_id;

  return jsonb_build_object('cron_jobs', jobs, 'request_id', request_id);
end;
$$;

revoke all on function public.crawler_verify() from public;
revoke all on function public.crawler_verify() from anon, authenticated;
grant execute on function public.crawler_verify() to service_role;
