-- 임시 RPC 삭제
--
-- 20260903010000 에서 만든 함수는 Vault 에 service_role_key 를 심는 것이 유일한 목적이었다.
-- 역할이 끝났으므로 지운다. 키를 교체해야 하면 Supabase SQL 에디터에서 직접 실행한다:
--
--   select vault.update_secret(
--     (select id from vault.secrets where name = 'service_role_key'),
--     '<새 키>'
--   );

drop function if exists public.crawler_set_service_key(text);
