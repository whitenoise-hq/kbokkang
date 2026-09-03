-- Vault 에 service role key 를 넣기 위한 **임시** RPC
--
-- 왜 필요한가: pg_cron 이 Edge Function 을 호출할 때 쓸 키를 Vault 에 넣어야 하는데,
-- 키를 마이그레이션에 적을 수 없다(public 레포). 그래서 값을 **인자로** 받는 함수를 만들고
-- 한 번 호출한 뒤 다음 마이그레이션에서 삭제한다.
--
-- 노출 평가: `service_role` 만 호출할 수 있다(자동 노출이 꺼져 있어 anon/authenticated 는
-- 권한이 없다). service_role 키를 아는 주체는 이미 DB 전체 권한을 가지므로 이 함수가
-- 새로 열어주는 것은 없다. 그래도 역할이 끝나면 지운다.

create or replace function public.crawler_set_service_key(new_key text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_id uuid;
begin
  if new_key is null or length(new_key) < 20 then
    raise exception '키가 비어 있거나 너무 짧습니다';
  end if;

  select vs.id into existing_id
    from vault.secrets as vs
   where vs.name = 'service_role_key';

  if existing_id is null then
    perform vault.create_secret(
      new_key,
      'service_role_key',
      'pg_cron 이 Edge Function 을 호출할 때 쓰는 키'
    );
  else
    perform vault.update_secret(existing_id, new_key);
  end if;

  -- 값은 절대 돌려주지 않는다. 길이만 확인용으로 반환한다.
  return format('service_role_key 등록 완료 (길이 %s)', length(new_key));
end;
$$;

revoke all on function public.crawler_set_service_key(text) from public;
revoke all on function public.crawler_set_service_key(text) from anon, authenticated;
grant execute on function public.crawler_set_service_key(text) to service_role;

comment on function public.crawler_set_service_key(text) is
  '임시 함수. Vault 에 service_role_key 를 심은 뒤 삭제한다.';
