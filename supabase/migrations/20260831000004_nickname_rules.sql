-- 닉네임 규칙 + 중복 확인
--
-- 앱 온보딩에서 처음 받고, 설정에서 수정할 수 있다.
-- 규칙은 packages/shared 의 nicknameSchema 와 같은 값이어야 한다
-- (NICKNAME_MIN_LENGTH / NICKNAME_MAX_LENGTH / NICKNAME_PATTERN).

-- ─────────────────────────────────────────────────────────────
-- 1. 대소문자 무시 유일성
-- ─────────────────────────────────────────────────────────────
-- 'Master' 와 'master' 를 다른 유저로 두면 사칭이 가능하다.
-- 기존의 정확 일치 unique 제약을 lower() 함수 인덱스로 교체한다.

alter table public.users drop constraint if exists users_nickname_key;

create unique index users_nickname_lower_unique_idx
  on public.users (lower(nickname))
  where nickname is not null;

comment on index public.users_nickname_lower_unique_idx is
  '대소문자 무시 유일성. nickname 이 null(온보딩 미완료)인 행은 제외한다.';

-- ─────────────────────────────────────────────────────────────
-- 2. 형식 제약
-- ─────────────────────────────────────────────────────────────
-- 클라이언트 검증(zod)만 믿지 않는다. 앱이 anon key 로 직접 붙으므로 DB 가 최종 방어선이다.

alter table public.users
  add constraint users_nickname_length check (
    nickname is null or char_length(nickname) between 2 and 12
  ),
  add constraint users_nickname_format check (
    nickname is null or nickname ~ '^[가-힣a-zA-Z0-9]+$'
  ),
  -- 앞뒤 공백이 섞여 들어오는 것을 막는다(공백만 다른 닉네임이 생기지 않게)
  add constraint users_nickname_trimmed check (
    nickname is null or nickname = btrim(nickname)
  );

-- ─────────────────────────────────────────────────────────────
-- 3. 중복 확인 RPC
-- ─────────────────────────────────────────────────────────────
-- users_select_own_or_admin 정책 때문에 유저는 자기 행만 조회할 수 있어
-- "이 닉네임 쓸 수 있나?" 를 물어볼 수 없다.
-- security definer 로 존재 여부만 boolean 으로 돌려준다 — 다른 유저의 닉네임은 노출되지 않는다.
--
-- 형식 검증은 하지 않는다. 화면에서 "형식 오류" 와 "이미 사용 중" 을 구분해 안내해야 하므로
-- 이 함수는 '사용 여부' 만 답한다.
--
-- 최종 저장 시에도 unique 인덱스가 다시 막는다. 확인과 저장 사이의 경합(동시에 같은 닉네임 저장)은
-- 이 함수로 막을 수 없고 unique 위반 에러로 처리해야 한다.

create or replace function public.is_nickname_available(candidate text)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select not exists (
    select 1
    from public.users
    where lower(nickname) = lower(btrim(candidate))
  )
$$;

comment on function public.is_nickname_available(text) is
  '닉네임 사용 가능 여부만 반환한다. 대소문자·앞뒤공백을 무시하고 비교한다. 형식 검증은 하지 않는다.';

revoke all on function public.is_nickname_available(text) from public;
grant execute on function public.is_nickname_available(text) to authenticated;
grant execute on function public.is_nickname_available(text) to service_role;
