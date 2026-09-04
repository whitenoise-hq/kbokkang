-- 무효 트리거 검증용 **임시** RPC
--
-- 유저·예측이 아직 없어서(앱은 6단계) 실데이터로 트리거를 확인할 수 없다.
-- 그래서 함수 안에서 테스트 데이터를 만들고 **마지막에 예외를 던져 전부 롤백**한다.
-- 결과는 예외 메시지로 돌려받는다. DB 에 잔여물이 남지 않는다.
--
-- 확인 후 삭제한다.

create or replace function public.crawler_test_void_trigger()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  test_user_id uuid := gen_random_uuid();
  cancelled_game_id uuid;
  observed public.prediction_result;
  observed_points int;
begin
  select id into cancelled_game_id from public.games where cancelled limit 1;
  if cancelled_game_id is null then
    raise exception 'TEST_RESULT: 취소 경기가 없어 검증 불가';
  end if;

  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
  values (test_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'void-trigger-test@example.invalid', '', now(), now());

  -- handle_new_user 트리거가 public.users 를 만들지 않았다면 직접 만든다
  insert into public.users (id, points)
  values (test_user_id, 0)
  on conflict (id) do nothing;

  -- 취소 경기에 pending 예측을 넣는다
  insert into public.predictions (user_id, game_id, pick_winner, result)
  values (test_user_id, cancelled_game_id, 'home', 'pending');

  -- 경기를 다시 건드려 트리거를 발화시킨다(크롤러의 반복 upsert 를 모사)
  update public.games set cancelled = true where id = cancelled_game_id;

  select result, earned_points into observed, observed_points
    from public.predictions
   where user_id = test_user_id and game_id = cancelled_game_id;

  -- 예외로 전부 롤백한다. 결과는 메시지로 전달.
  raise exception 'TEST_RESULT: result=% earned_points=%', observed, observed_points;
end;
$$;

revoke all on function public.crawler_test_void_trigger() from public;
revoke all on function public.crawler_test_void_trigger() from anon, authenticated;
grant execute on function public.crawler_test_void_trigger() to service_role;
