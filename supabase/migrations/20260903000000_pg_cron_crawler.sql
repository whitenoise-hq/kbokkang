-- 크롤러 스케줄을 GitHub Actions → Supabase Cron(pg_cron) 으로 이전
--
-- 왜 옮기는가 (실측):
-- 2026-09-01 예정 실행 약 30회 중 2회, 09-02 는 4회만 실제로 만들어졌다.
-- GitHub 문서가 부하 시 큐 작업이 **버려진다**고 명시한다. 실효 간격이 4~5시간이 되어
-- 정산이 경기 종료 후 2시간 30분 뒤에 이뤄졌다(09-02 경기 → 09-03 00:16 정산).
-- pg_cron 은 Postgres 안에서 돌아 큐 대기도 결번도 없다.
--
-- cron 은 고정 간격이고, **실제로 일할지는 Edge Function 의 게이트가 판단한다**
-- (`supabase/functions/_shared/gate.ts`): 첫 경기 시작 1시간 전부터, 전 경기 정산
-- 완료까지만 소스를 부른다. 판단을 cron 에 두지 않은 이유는 동적 스케줄이 상태를
-- 만들기 때문이다 — 등록 실패하면 그날 정산이 안 돌고, 해제 실패하면 계속 돈다.
--
-- ⚠️ 선행 조건: Vault 에 service role key 를 등록해야 한다. 키는 이 파일에 넣지 않는다
--    (public 레포다). 등록 SQL 은 docs/00_통합기획서.md 3장 참조.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ─────────────────────────────────────────────────────────────
-- 호출 헬퍼
-- ─────────────────────────────────────────────────────────────

-- 유저에게 노출되지 않는 스키마. 이 함수는 service role key 를 읽으므로
-- 아무에게도 grant 하지 않는다(pg_cron 은 job 소유자 = postgres 로 실행한다).
create schema if not exists crawler;

revoke all on schema crawler from public;
revoke all on schema crawler from anon, authenticated;

/**
 * Edge Function 을 service role 로 호출한다.
 *
 * Vault 에서 키를 읽는다 — 마이그레이션에 시크릿을 넣지 않기 위해서다.
 * search_path 를 비웠으므로 모든 객체를 스키마까지 적어야 한다.
 */
create or replace function crawler.invoke(function_name text, payload jsonb default '{}'::jsonb)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  service_key text;
  request_id bigint;
begin
  select vs.decrypted_secret
    into service_key
    from vault.decrypted_secrets as vs
   where vs.name = 'service_role_key';

  if service_key is null or service_key = '' then
    raise exception 'vault 에 service_role_key 가 없습니다. 등록 SQL 을 먼저 실행하세요';
  end if;

  select net.http_post(
           url := 'https://iwggqsjrkjwkpuakunmc.supabase.co/functions/v1/' || function_name,
           headers := jsonb_build_object(
             'Content-Type', 'application/json',
             'Authorization', 'Bearer ' || service_key
           ),
           body := payload,
           timeout_milliseconds := 55000
         )
    into request_id;

  return request_id;
end;
$$;

revoke all on function crawler.invoke(text, jsonb) from public;
revoke all on function crawler.invoke(text, jsonb) from anon, authenticated;

comment on function crawler.invoke(text, jsonb) is
  'pg_cron 전용. service role key 를 vault 에서 읽어 Edge Function 을 호출한다.';

-- ─────────────────────────────────────────────────────────────
-- 스케줄
-- ─────────────────────────────────────────────────────────────
--
-- ⚠️ pg_cron 은 **UTC** 로 동작한다. KST = UTC+9.
--
-- 정산: UTC 00:00~16:00 30분 간격 = KST 09:00~01:00 (하루 34회)
--   - KST 09:00 첫 실행이 오늘 일정 수집 + 어제 미정산 복구를 한다(게이트 조건 1)
--   - 가장 이른 경기(월·일 13:00~14:00)부터 가장 늦은 종료(우천 지연 포함)까지 덮는다
--   - 01:00 이후 끝난 경기는 다음 날 09:00 실행이 자기복구로 주워간다
--
-- 일정: 월요일 UTC 00:00 = KST 09:00. 기준일 포함 7일치(월~일)

select cron.schedule(
  'kbo-settle',
  '0,30 0-16 * * *',
  $$select crawler.invoke('kbo-settle')$$
);

select cron.schedule(
  'kbo-schedule',
  '0 0 * * 1',
  $$select crawler.invoke('kbo-schedule')$$
);
