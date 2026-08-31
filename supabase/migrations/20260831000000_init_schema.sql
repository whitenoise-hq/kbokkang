-- 크보깡 초기 스키마
-- 통합기획서 5장 기준. 컬럼을 바꿔야 하면 문서를 먼저 고치고 새 마이그레이션을 추가한다.
--
-- 프로젝트 설정: "Automatically expose new tables" 를 껐으므로 테이블마다 명시적 grant 가 필요하고,
-- "Enable automatic RLS" 를 켰으므로 새 테이블은 만들자마자 전부 거부(fail-closed)된다.
-- 정책을 안 만들면 쿼리가 빈 결과만 돌려준다 — 버그가 아니다.

-- ─────────────────────────────────────────────────────────────
-- 1. enum
-- ─────────────────────────────────────────────────────────────

create type public.card_grade as enum ('normal', 'rare', 'epic', 'legend', 'mythic');
create type public.card_type as enum ('player', 'mascot', 'item');
create type public.game_status as enum ('scheduled', 'closed', 'live', 'aggregating', 'settled');
create type public.prediction_pick as enum ('home', 'away');
create type public.prediction_result as enum ('pending', 'win_hit', 'score_hit', 'miss');
create type public.draw_type as enum ('normal', 'premium');
create type public.point_reason as enum (
  'signup', 'predict_win', 'predict_score', 'draw', 'duplicate_refund', 'sell', 'admin_adjust'
);

-- ─────────────────────────────────────────────────────────────
-- 2. 운영자 판별 헬퍼
-- ─────────────────────────────────────────────────────────────

-- 권한은 auth.users.app_metadata.role 에 저장한다.
-- user_metadata 는 유저가 직접 수정할 수 있어 권한 판단에 쓸 수 없다.
-- JWT 클레임을 읽으므로 테이블 조회가 발생하지 않는다.
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

comment on function public.is_admin() is
  '운영자 여부. auth.users.app_metadata.role 클레임 기반이며 테이블 조회가 없다.';

-- ─────────────────────────────────────────────────────────────
-- 3. teams (구단)
-- ─────────────────────────────────────────────────────────────

create table public.teams (
  id int generated always as identity primary key,
  name text not null unique,
  short_name text not null,
  logo_url text,
  color text not null,

  -- 팀 컬러는 #RRGGBB 6자리만 허용한다(축약형은 화면마다 해석이 갈림)
  constraint teams_color_hex check (color ~ '^#[0-9A-Fa-f]{6}$')
);

comment on column public.teams.short_name is '테이블·경기 목록·배지용 약칭. 전체 팀명은 너무 길다.';
comment on column public.teams.logo_url is '미등록(null)이면 화면에서 팀 컬러 원형으로 대체 표시한다.';

-- ─────────────────────────────────────────────────────────────
-- 4. users (Supabase Auth 확장 프로필)
-- ─────────────────────────────────────────────────────────────

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text unique,
  favorite_team_id int references public.teams (id) on delete set null,
  points int not null default 200,
  created_at timestamptz not null default now(),

  constraint users_points_non_negative check (points >= 0)
);

comment on column public.users.nickname is
  '가입 시점에는 null. 온보딩에서 정한다. 앱은 null 이면 온보딩을 띄운다.';
comment on table public.users is
  '게임 유저 프로필. 운영자 계정은 이 테이블에 행을 만들지 않는다(handle_new_user 참조).';

-- ─────────────────────────────────────────────────────────────
-- 5. cards (카드 마스터)
-- ─────────────────────────────────────────────────────────────

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  dex_no text not null unique,
  name text not null,
  grade public.card_grade not null,
  type public.card_type not null,
  image_url text,
  draw_weight int not null default 1,
  is_season boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,

  constraint cards_draw_weight_range check (draw_weight between 1 and 1000),
  constraint cards_dex_no_format check (dex_no ~ '^[NRELM][0-9]{2,}$'),

  -- 도감번호 접두어와 등급이 어긋나는 것을 막는다(E01 인데 grade=normal 같은 상태)
  constraint cards_dex_no_matches_grade check (
    left(dex_no, 1) = case grade
      when 'normal' then 'N'
      when 'rare' then 'R'
      when 'epic' then 'E'
      when 'legend' then 'L'
      when 'mythic' then 'M'
    end
  )
);

comment on column public.cards.image_url is
  'Storage 참조. null 허용 — 이미지 없이 먼저 등록하는 흐름을 지원한다.';
comment on column public.cards.deleted_at is
  'soft delete. 조회는 기본 deleted_at is null. 비워진 도감번호는 재사용하지 않는다.';
comment on table public.cards is
  '판매가/환급가는 저장하지 않는다. 등급 기준 상수(packages/shared)로 계산한다.';

-- 도감번호순(등급 순서 → 순번) 정렬과 목록 조회용
create index cards_grade_dex_no_idx on public.cards (grade, dex_no) where deleted_at is null;

-- ─────────────────────────────────────────────────────────────
-- 6. user_cards (유저 보유 카드)
-- ─────────────────────────────────────────────────────────────

create table public.user_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete restrict,
  count int not null default 1,
  acquired_at timestamptz not null default now(),

  constraint user_cards_count_positive check (count >= 1),
  -- 유저+카드 한 쌍은 한 행. 중복 보유는 count 로 표현한다
  constraint user_cards_unique_pair unique (user_id, card_id)
);

comment on constraint user_cards_unique_pair on public.user_cards is
  '중복 보유는 행을 늘리지 않고 count 를 올린다. 도감 진행률 집계가 distinct 없이 가능해진다.';

create index user_cards_card_id_idx on public.user_cards (card_id);

-- ─────────────────────────────────────────────────────────────
-- 7. games (경기)
-- ─────────────────────────────────────────────────────────────

create table public.games (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  game_date date not null,
  start_at timestamptz not null,

  -- 마감 시각은 DB 가 계산한다(아래 set_predict_close_at 트리거).
  -- 생성 컬럼을 쓸 수 없다: timestamptz - interval 은 STABLE 이라 생성 컬럼의 IMMUTABLE 조건을 못 만족한다.
  -- 오프셋을 바꾸려면 트리거와 packages/shared 의 PREDICT_CLOSE_OFFSET_MINUTES 를 함께 고친다.
  predict_close_at timestamptz not null,

  home_team_id int not null references public.teams (id) on delete restrict,
  away_team_id int not null references public.teams (id) on delete restrict,
  status public.game_status not null default 'scheduled',
  home_score int,
  away_score int,
  settled_at timestamptz,

  constraint games_teams_differ check (home_team_id <> away_team_id),
  constraint games_scores_non_negative check (
    (home_score is null or home_score >= 0) and (away_score is null or away_score >= 0)
  ),
  -- 정산 완료면 스코어가 반드시 있어야 한다
  constraint games_settled_has_scores check (
    status <> 'settled' or (home_score is not null and away_score is not null)
  )
);

comment on column public.games.external_id is
  '원본 경기 ID. 30분마다 재수집하므로 이 값으로 upsert 해 중복을 막는다. (날짜,홈,원정) 은 더블헤더에서 깨지고 start_at 은 우천 지연 시 바뀐다. 수동 등록은 null.';

create index games_game_date_idx on public.games (game_date desc, start_at);
create index games_status_idx on public.games (status) where status <> 'settled';

-- 예측 마감 = 경기 시작 - 1시간. 크롤러가 계산해 넣으면 틀릴 수 있어 DB 가 보장한다.
create or replace function public.set_predict_close_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.predict_close_at := new.start_at - interval '1 hour';
  return new;
end;
$$;

create trigger games_set_predict_close_at
  before insert or update of start_at on public.games
  for each row execute function public.set_predict_close_at();

-- ─────────────────────────────────────────────────────────────
-- 8. predictions (예측)
-- ─────────────────────────────────────────────────────────────

create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  pick_winner public.prediction_pick not null,
  pick_home_score int,
  pick_away_score int,
  result public.prediction_result not null default 'pending',
  earned_points int,
  created_at timestamptz not null default now(),

  -- 한 경기에 한 건만
  constraint predictions_unique_per_game unique (user_id, game_id),
  -- 스코어 예측은 홈/원정 둘 다 있거나 둘 다 없어야 한다
  constraint predictions_score_pair check (
    (pick_home_score is null) = (pick_away_score is null)
  ),
  constraint predictions_score_range check (
    (pick_home_score is null or pick_home_score between 0 and 99)
    and (pick_away_score is null or pick_away_score between 0 and 99)
  ),
  constraint predictions_earned_points_non_negative check (
    earned_points is null or earned_points >= 0
  )
);

create index predictions_game_id_idx on public.predictions (game_id);
create index predictions_user_created_idx on public.predictions (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- 9. draws (뽑기 로그)
-- ─────────────────────────────────────────────────────────────

create table public.draws (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  card_id uuid not null references public.cards (id) on delete restrict,
  draw_type public.draw_type not null,
  cost int not null,
  is_duplicate boolean not null,
  refund_points int not null default 0,
  created_at timestamptz not null default now(),

  constraint draws_cost_non_negative check (cost >= 0),
  constraint draws_refund_non_negative check (refund_points >= 0),
  -- 중복이 아니면 환급이 있을 수 없다
  constraint draws_refund_only_when_duplicate check (is_duplicate or refund_points = 0)
);

create index draws_user_created_idx on public.draws (user_id, created_at desc);
create index draws_card_id_idx on public.draws (card_id);
create index draws_created_at_idx on public.draws (created_at desc);

-- ─────────────────────────────────────────────────────────────
-- 10. point_transactions (포인트 변동 내역)
-- ─────────────────────────────────────────────────────────────

create table public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  amount int not null,
  reason public.point_reason not null,
  ref_id uuid,
  memo text,
  created_at timestamptz not null default now(),

  constraint point_transactions_amount_non_zero check (amount <> 0),
  -- 운영자 수동 조정은 사유가 없으면 추적이 불가능하다
  constraint point_transactions_admin_needs_memo check (
    reason <> 'admin_adjust' or (memo is not null and length(trim(memo)) > 0)
  )
);

create index point_transactions_user_created_idx
  on public.point_transactions (user_id, created_at desc);
create index point_transactions_created_at_idx on public.point_transactions (created_at desc);

-- ─────────────────────────────────────────────────────────────
-- 11. crawl_runs (크롤링 실행 이력)
-- ─────────────────────────────────────────────────────────────

create table public.crawl_runs (
  id uuid primary key default gen_random_uuid(),
  target_date date not null,
  run_at timestamptz not null default now(),
  success boolean not null,
  games_found int not null default 0,
  games_settled int not null default 0,
  error text,

  constraint crawl_runs_counts_non_negative check (games_found >= 0 and games_settled >= 0)
);

comment on table public.crawl_runs is
  '이 테이블이 없으면 "크롤링이 안 돌았는지"와 "경기가 없는 날인지"를 구분할 수 없다.';

create index crawl_runs_target_date_idx on public.crawl_runs (target_date desc, run_at desc);

-- ─────────────────────────────────────────────────────────────
-- 12. 가입 트리거 — 프로필 생성 + 가입 보너스
-- ─────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 운영자 계정은 게임 유저가 아니므로 프로필을 만들지 않는다(유저 목록에 섞이면 안 됨)
  if coalesce(new.raw_app_meta_data ->> 'role', '') = 'admin' then
    return new;
  end if;

  insert into public.users (id) values (new.id);

  insert into public.point_transactions (user_id, amount, reason)
  values (new.id, 200, 'signup');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 13. RLS
-- ─────────────────────────────────────────────────────────────
-- 앱이 anon key 로 DB 에 직접 붙으므로 RLS 가 유일한 방어선이다.
-- 쓰기 경로(뽑기·정산·포인트 지급·도감번호 부여)는 전부 서버(service role)에서만 수행하므로
-- 유저에게 insert/update 정책을 주지 않는다. service role 은 RLS 를 우회한다.

alter table public.teams enable row level security;
alter table public.users enable row level security;
alter table public.cards enable row level security;
alter table public.user_cards enable row level security;
alter table public.games enable row level security;
alter table public.predictions enable row level security;
alter table public.draws enable row level security;
alter table public.point_transactions enable row level security;
alter table public.crawl_runs enable row level security;

-- teams: 전 유저 읽기, 운영자만 쓰기
create policy teams_select_authenticated on public.teams
  for select to authenticated using (true);
create policy teams_admin_all on public.teams
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- cards: 삭제되지 않은 카드는 전 유저 읽기. 운영자는 전체 조회·쓰기
create policy cards_select_active on public.cards
  for select to authenticated using (deleted_at is null or public.is_admin());
create policy cards_admin_all on public.cards
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- users: 본인 또는 운영자만 조회. 수정 가능 컬럼은 아래 grant 로 제한한다(닉네임·응원팀만).
create policy users_select_own_or_admin on public.users
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy users_update_own on public.users
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy users_admin_all on public.users
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- user_cards / draws / point_transactions: 본인 또는 운영자 조회만. 쓰기는 서버 전용
create policy user_cards_select_own_or_admin on public.user_cards
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy draws_select_own_or_admin on public.draws
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy point_transactions_select_own_or_admin on public.point_transactions
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- games: 전 유저 읽기(결과는 모두에게 동일), 운영자만 쓰기
create policy games_select_authenticated on public.games
  for select to authenticated using (true);
create policy games_admin_all on public.games
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- predictions: 본인 것 조회·등록. 마감 전에만 등록 가능(서버 시각 기준).
-- 정산 결과(result·earned_points)는 서버만 쓴다 → update 정책을 주지 않는다.
create policy predictions_select_own_or_admin on public.predictions
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy predictions_insert_own_before_close on public.predictions
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and result = 'pending'
    and earned_points is null
    and exists (
      select 1 from public.games g
      where g.id = game_id and now() < g.predict_close_at
    )
  );
create policy predictions_admin_all on public.predictions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- crawl_runs: 운영자만 조회. 쓰기는 크롤러(service role) 전용
create policy crawl_runs_select_admin on public.crawl_runs
  for select to authenticated using (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 14. grant
-- ─────────────────────────────────────────────────────────────
-- "Automatically expose new tables" 를 껐으므로 명시적으로 권한을 준다.
-- anon 에는 아무 테이블 권한도 주지 않는다(로그인 전에는 접근할 것이 없다).

grant usage on schema public to authenticated;

grant select on public.teams to authenticated;
grant select on public.cards to authenticated;
grant select on public.games to authenticated;
grant select on public.user_cards to authenticated;
grant select on public.draws to authenticated;
grant select on public.point_transactions to authenticated;
grant select on public.crawl_runs to authenticated;

-- ⚠️ update 를 테이블 전체로 주면 유저가 자기 points 를 직접 올릴 수 있다.
-- RLS 는 컬럼을 제한하지 못하므로 컬럼 단위 grant 로 막는다.
-- 포인트 변동은 서버(service role)에서만 수행한다.
grant select on public.users to authenticated;
grant update (nickname, favorite_team_id) on public.users to authenticated;
grant select, insert on public.predictions to authenticated;

-- 운영자 쓰기는 위 RLS 정책으로 통제되므로 테이블 권한도 함께 필요하다
grant insert, update, delete on public.teams to authenticated;
grant insert, update, delete on public.cards to authenticated;
grant insert, update, delete on public.games to authenticated;
grant insert, update, delete on public.predictions to authenticated;

grant execute on function public.is_admin() to authenticated;
