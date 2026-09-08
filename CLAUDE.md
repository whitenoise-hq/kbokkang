# CLAUDE.md — 크보깡 (kbokkang)

## 프로젝트 요약

KBO 경기 승부예측 → 적중 시 포인트 획득 → 포인트로 야구 카드 뽑기 → 도감 수집. 개인용 모바일 앱.

## 반드시 먼저 읽을 문서 (docs/)

- `docs/00_통합기획서.md` — **마스터 문서.** 전체 그림, 개발 순서, 기술 스택, 데이터 스키마, 포인트 경제. 개발 전 필수.
- `docs/01_어드민기획서.md` — 어드민(먼저 개발) 화면·기능.
- `docs/02_앱기획서.md` — 앱(나중 개발) 화면·기능.
- `docs/03_카드프롬프트가이드.md` — 카드 이미지 생성 프롬프트(개발과 병행되는 에셋 작업).
- `docs/04_앱디자인가이드.md` — **디자인 단일 출처(토스 스타일).** 색·타이포·여백·radius·그림자·애니메이션 토큰. **UI 작업 전 반드시 확인.**

## 기술 스택

- 모노레포: Turborepo + pnpm. 레포명 `kbokkang`, npm 스코프 `@kbokkang/*`.
  - `apps/mobile` (Expo + React Native) / `apps/admin` (Next.js)
  - `packages/shared` (공통 상수·타입·디자인 토큰) / `packages/assets` (공용 폰트 등 정적 파일)
- 백엔드: Supabase (DB + Auth + Storage). 크롤링/정산: **Supabase Cron(pg_cron) + Edge Function**.

## 개발 순서 (엄수)

**화면(UI) → 스키마 → 연결 순서.** 화면을 구현하면서 필요한 필드·상태가 드러나 스키마가 바뀌므로,
스키마를 먼저 확정하지 않는다(마이그레이션 반복 방지).

1. 모노레포 기본 구조 + 공통 상수/디자인 토큰 — ✅ 완료
2. **어드민 화면(apps/admin)** — 목업 데이터로 UI 먼저 — ✅ 완료
3. **스키마 확정 + Supabase 세팅** — ✅ 완료
4. 어드민 ↔ Supabase 연결(목업 → 실데이터, RLS·권한) — ✅ 완료
5. 크롤링/정산(GitHub Actions) — ✅ 완료
6. 앱(apps/mobile) — 여기도 화면 먼저, 연결 나중 — 🔄 진행 중 (6-1 골격 · 6-2 화면 완료)

## 공통 규칙 (중요)

- 포인트 값·뽑기 확률·판매가·등급 정의는 **`packages/shared`에 단일 정의**. 앱/어드민 중복 정의 금지.
- 카드 등급: N(일반)/R(레어)/E(에픽)/L(레전드)/M(신화). 색: 회/파/보/금/빨.
- 도감번호: 등급 접두어 + 2자리(N01…). 어드민에서 등급 선택 시 자동 부여.
- 판매/환급가는 카드에 저장하지 않고 등급 기준 상수로 계산.
- 예측 마감/정산은 **서버 시각 기준**. 뽑기 추첨도 **서버에서** 처리(클라 신뢰 금지).
- 카드 이미지는 통이미지 1장. 텍스트(이름/번호)는 이미지가 아니라 코드로 렌더.
- **UI/디자인 작업은 `docs/04_앱디자인가이드.md` 토큰만 사용.** 화면마다 색·폰트·여백 즉흥 지정 금지.
  - 앱(`apps/mobile`): 디자인 가이드 토큰(`@kbokkang/shared`의 `theme.ts`) 적용.
  - 어드민(`apps/admin`): shadcn/ui 사용(디자인 가이드 대상 아님). primary만 브랜드 컬러 공유.
  - 등급색은 카드·등급 표시 전용. 일반 UI 버튼 등에 남용 금지.

### 어드민 UI 규격 (구현 확정)

- 레이아웃: **전체화면 너비**. 좌측 사이드바(w-56, `--sidebar` 배경) + 본문 `px-6 py-10`.
- 표면 계층: 페이지 `#F4F6F8` / 카드·모달·사이드바 흰색. **흰 배경에 흰 카드 금지**(구분 안 됨).
  - 흰 표면에는 `bg-card`를 쓴다. `bg-background`는 회색 페이지용.
- 애니메이션(hatch-it 규격): `main`에 `content-in`, 모달은 `letter-open` + 백드롭 blur,
  토스트는 상단 중앙 알약형 2.5초.
  - ⚠️ Tailwind v4는 `translate-x-[-50%]`를 `transform`이 아니라 **독립 `translate` 속성**으로
    컴파일한다. 모달 키프레임에 `translate(-50%)`를 넣으면 두 배로 밀린다.
- 캘린더는 **직접 구현**(`components/date-picker.tsx`). 캘린더 라이브러리 설치 금지.
- 차트는 **recharts**. 축·툴팁 스타일은 `components/charts/chart-theme.ts`에 단일 정의.
- 스켈레톤: 데이터 화면마다 라우트 `loading.tsx`. **실제 레이아웃과 같은 높이**로 맞출 것.
- 포커스 링 제거됨(`globals.css` 하단, `@layer` 밖). 되살리려면 그 블록만 삭제.
- shadcn 컴포넌트를 직접 수정한 것들(`table`, `card`, `dialog`, `alert-dialog`, `sheet`, `tabs`,
  `button`, `sonner`)은 **CLI로 다시 add 하면 덮어써진다.** 재생성 시 재적용 필요.
- `exactOptionalPropertyTypes`는 어드민에서만 해제(Radix 미지원). `packages/shared`는 유지.
- **폰트(Pretendard)는 `packages/assets/fonts/pretendard/`에 파일로 보관.** npm 패키지 설치 금지(97MB, RN에서 못 씀).
  - 웹(admin): `web/*.woff2` — `next/font/local`로 참조.
  - 앱(mobile): `native/*.otf` — RN은 woff2 불가.
  - 굵기는 Regular(400)/SemiBold(600)/Bold(700) 3종만. 라이선스 OFL 1.1, `LICENSE.txt` 동봉 유지.

## 현재 상태

**1단계 완료** — 모노레포(Turborepo + pnpm), `apps/admin`(Next 16 / React 19 / Tailwind 4 / shadcn),
`packages/shared`(상수·디자인 토큰·도메인 모델·zod 스키마), `packages/assets`(Pretendard).

**2단계 완료 — 어드민 화면 10개(목업 데이터, DB 미연결)**

레이아웃·사이드바 / 대시보드 / 카드 관리 / 카드 일괄 업로드 / 유저 관리 /
경기 관리 / 구단 관리 / 통계 / 규칙 확인 / 로그인

- 라우트 구조: 사이드바 셸은 `app/(dashboard)/layout.tsx`, 로그인은 그룹 밖(`app/login`).
  route group 은 URL 에 영향을 주지 않는다.
- 당시 데이터는 `repositories` 의 fixture 기반 in-memory 구현이었다.
  4단계에서 `supabase` 구현으로 교체했고 화면 코드는 수정하지 않았다.
  **더미데이터는 5단계 이후 삭제했다** — 실 DB 가 붙었고 아무 곳도 참조하지 않았다.
- `apps/mobile`은 6단계에서 생성했다(아래).

**3·4단계 완료 — Supabase 세팅 + 스키마 + 인증 + 어드민 실연결**

- 프로젝트 `iwggqsjrkjwkpuakunmc` (Seoul). Data API 켬 / 새 테이블 자동 노출 끔 / 자동 RLS 켬.
- `supabase/migrations/` 7개 적용 — 테이블 9개, 구단 10팀 seed, Storage 버킷 2개,
  집계 뷰 5개, RPC 4개(`is_admin` `is_nickname_available` `settle_game` `create_cards_bulk`).
- **어드민 화면 10개가 실제 DB 를 쓴다.** `repositories = supabaseRepositories` 한 줄 교체로
  전환했고 화면 코드는 수정하지 않았다.
- 이미지는 클라이언트 canvas 압축 후 Storage 업로드(카드 1200px / 로고 256px, WebP).
- **마이그레이션 파일은 수정하지 않는다.** 스키마를 바꿔야 하면 통합기획서 5장을 먼저 고치고
  **새 마이그레이션을 추가**한다.

**현재 데이터 상태**

- `teams`(seed 10팀) / `games`(크롤러가 채움) / `crawl_runs` 는 데이터가 있다.
- `cards` 는 운영자가 등록해야 하고 `users` 는 앱(6단계) 이후에 생긴다.
- 그래서 카드·유저 관련 통계가 0 으로 보인다 — 정상이다.
- **더미데이터(`in-memory.ts`, `fixtures/`)는 삭제했다.** 구현은 `supabase.ts` 하나다.
  앱 화면(6단계)을 DB 없이 만들 필요가 생기면 그때 앱 쪽에 따로 만든다 —
  어드민 fixture 를 되살리지 않는다(실 DB 와 두 갈래로 갈라져 화면이 어긋난다).

**5단계 완료 — 크롤링/정산 (Supabase Cron + Edge Function)**

- 데이터 소스: **네이버 스포츠 `api-gw`**. 조사 근거와 소스 신뢰 방침은 통합기획서 3장.
- **로직은 `supabase/functions/_shared/` 에 한 벌만 있다.** Edge Function(Deno)과
  로컬 CLI(`apps/crawler`, Node)가 **같은 파일**을 임포트한다.
  - `_shared` — 플랫폼 무관. 설정을 전부 **인자로 받는다**(`process.env`/`Deno.env` 금지).
  - `_runtime` — **Deno 전용**(`Deno` 전역을 쓰는 파일만). `_shared` 에 두면 Node 타입체크가 깨진다.
  - `apps/crawler` 는 껍데기 CLI + 테스트다. 로직을 여기에 다시 쓰지 말 것.
- 스케줄: `supabase/migrations/20260903000000_pg_cron_crawler.sql`
  - 정산 `0,30 0-16 * * *` (UTC) = **KST 09:00~01:00 30분 간격**
  - 일정 `0 0 * * 1` (UTC) = **월 KST 09:00**, 기준일 포함 7일
  - ⚠️ **pg_cron 은 UTC 로 동작한다.**
- **게이트(`_shared/gate.ts`)가 실제로 일할지 판단한다.** cron 은 고정 간격이고,
  첫 경기 시작 1시간 전부터 전 경기 정산 완료까지만 소스를 부른다.
  - **소스 호출 실측 하루 13~18회**(09-04 13 / 09-05 13 / 09-06 18). cron 34슬롯 중 그만큼만
    일한다. 평일은 17:30~23:00 구간이라 13회, 일요일은 14:00 경기가 있어 13:00 부터 열려 18회다.
- **pg_cron 은 정확하다(실측):** 30분마다 정확히 발화(`16:30:00.116` 등), 결번·지연 0.
  GitHub Actions 가 30회 중 2~4회였던 것과 대조된다.
- **정산 지연 실측 30분 이내**(09-04~06 15경기). 정산 시각이 전부 cron 슬롯 정각(`:00`/`:30`)에
  찍혔다 — 경기 종료 후 다음 슬롯에서 바로 처리된다는 뜻이다. 이전(Actions)은 2시간 30분이었다.

**크롤러 작업 시 주의**

- ⚠️⚠️ **GitHub Actions `schedule` 로 돌아가지 말 것.** 실측으로 버렸다:
  09-01 예정 약 30회 중 **2회**, 09-02 는 **4회**만 실제로 만들어졌다. GitHub 문서가 부하 시
  큐 작업이 **버려진다**고 명시한다. 실효 간격이 4~5시간이 되어 **정산이 경기 종료 2시간
  30분 뒤**에 됐다(09-02 경기 → 09-03 00:16). 워크플로 설정 문제가 아니었다 —
  `active`, Actions 활성, public 레포라 쿼터 무관, 실행된 건은 전부 성공이었다.
  - 두 워크플로는 **`workflow_dispatch` 전용**으로 남겨뒀다(로그 보기 편한 수동 복구 경로).
    `schedule:` 을 되살리면 소스 호출이 두 배가 된다.
- ⚠️ **자기복구를 없애지 말 것:** 정산은 오늘만 보지 않고 **최근 3일**(`LOOKBACK_DAYS`)의
  미정산 경기를 훑는다. 플랫폼을 바꿨어도 남긴다 — 새 플랫폼도 장애가 난다.
  - 하루만 보던 시절 9/1 5경기가 `live` 로 멈춰 영구 미정산이 됐다. 다음 실행은 이미
    날짜가 바뀌어 9/2 를 보고 있었고 아무도 어제를 돌아보지 않았다.
  - 그래서 **cron 창이 KST 자정을 넘어가도 문제없다** — 어제가 범위 안이다.
- ⚠️ **service role key 형식이 두 가지다.** Supabase 가 키 체계를 이전 중이라 한 프로젝트에
  공존한다: Edge Function 에 주입되는 값은 **신규 `sb_secret_...`(41자)**, 어드민 `.env` 는
  **레거시 JWT `eyJ...`(219자)**. 그래서 `auth.ts` 는 두 경로를 모두 받는다(주입값 일치 또는
  JWT `role` 클레임). 단순 문자열 비교만 하면 레거시로 부르는 호출이 전부 401 이다(겪었다).
  - JWT 클레임 검사는 **게이트웨이가 서명을 검증했다는 전제**다. `verify_jwt` 를 끄지 말 것.
- ⚠️ **게이트는 `crawl_runs.run_at` 으로 "하루 첫 실행"을 판정한다.** `target_date` 로 보면
  안 된다 — 주간 일정 잡이 7일치 행을 **미리** 쓰기 때문에 "오늘 기록 없음"이 성립하지 않고,
  주중에 추가된 경기를 다음 월요일까지 못 잡는다.
- ⚠️ **예측은 무료다(포인트를 걸지 않는다).** 그래서 경기 취소 시 환급이 없다.
  취소 경기의 예측은 DB 트리거가 `void`(무효)로 마감한다 — 안 하면 `pending` 으로 남아
  유저 화면에 "집계 중"이 영원히 뜬다.
  - 통계에서 제외할 것: 연승은 `void` 로 끊지 않고, 적중률 분모는 `resolvedPredictions` 를 쓴다.
- ⚠️⚠️ **취소 경기는 `games.cancelled = true` 로 표시한다.** 안 하면 배치 전체가 죽는다:
  크롤러는 취소 경기를 `status='settled'`(처리 종료)로 넣는데 스코어가 없어서
  `games_settled_has_scores` 제약을 위반한다. **upsert 가 한 배치로 나가므로 취소 1건이
  그날 5경기 전부를 막는다** — 2026-09-03 에 실제로 그랬고 정상 종료된 4경기도 미정산으로 남았다.
- ⚠️⚠️ **실패를 `crawl_runs` 에 기록하지 않으면 조용히 죽는다.** 위 장애 때 34회 연속
  실패했는데 기록이 없어서 사람이 미정산을 눈치채기 전까지 아무도 몰랐다.
  Edge Function 으로 옮길 때 이 기록을 빠뜨린 것이 원인이었다. `runSettle` 의 catch 를 지우지 말 것.
  - 진단 경로: `cron.job_run_details`(발화 여부) / `net._http_response`(HTTP 상태) /
    함수를 직접 curl(에러 메시지). pg_net 은 비동기라 실패가 조용하다.
- ⚠️ **`crawl_runs.target_date` 는 "이 날짜를 수집했다"는 뜻.** 여러 날짜를 수집하면
  **날짜마다 한 행**을 남겨야 한다. 시작일 한 행만 남겼더니 나머지 6일이 어드민에서
  "수집 이력 없음"으로 보였다. 경기 0건인 날짜도 행을 남긴다(그게 "경기 없는 날"의 증거).
- 승패는 소스의 `winner` 를 쓰지 않고 스코어로 판정한다. 취소 경기는 0:0 으로 오므로
  스코어를 null 로 남긴다.
- 소스 `gameDateTime` 에 타임존 표기가 없다 — KST 로 해석해야 한다.
- 응답 구조가 어긋나면 **실패시킨다.** 추측해서 채우면 스코어가 0 으로 들어간다.
- 워크플로 트리거에 `pull_request` 를 추가하지 않는다 — public 레포라 외부인이 PR 로
  시크릿을 빼갈 수 있다. `workflow_dispatch` 만 둔다.
- ⚠️ **Edge Function 의 `import_map` 은 자동 탐색되지 않는다.** `supabase/config.toml` 의
  `[functions.<name>] import_map` 에 명시해야 배포 번들에 적용된다(빼먹으면 `zod` 를
  "relative import path not prefixed with ./" 로 거부한다 — 겪었다).
  - 소스는 **베어 스펙파이어**(`zod`)를 쓴다. Node 는 node_modules, Deno 는 import_map 으로
    해석한다. 소스에 `npm:` 을 박으면 Node 쪽(CLI·테스트)이 깨진다.
  - **import_map 버전은 pnpm 워크스페이스 버전과 일치시킬 것.** 어긋나면 테스트와 배포된
    함수가 다른 라이브러리로 돈다.
- ⚠️ **pg_cron 은 Vault 에서 키를 읽는다.** 마이그레이션에 시크릿을 넣지 않는다(public 레포).
  Vault 등록은 사람이 SQL 에디터에서 한 번 한다 — 통합기획서 3장 참조.

**배포 / 레포**

- **레포는 public.** 비공개 조직 레포는 Vercel Git 연동이 Pro(유료)라서 전환했다.
- 어드민: **Vercel Hobby**, Root Directory `apps/admin`.
- ⚠️ Vercel 환경변수 3개 필요. **빌드에는 `NEXT_PUBLIC_*` 2개만 필요하고
  `SUPABASE_SERVICE_ROLE_KEY` 는 런타임에만 쓰인다** — 빠뜨리면 빌드는 통과하고
  포인트 조정·수동 정산에서만 터진다.
- `turbo.json` 의 `tasks.build.env` 에 세 변수를 선언해뒀다. `NEXT_PUBLIC_*` 은 Turborepo
  프레임워크 추론으로 자동 통과되지만, 선언하면 **캐시 해시에 값이 포함된다** —
  선언 전에는 `.env` 있을 때 만든 빌드가 환경변수 없는 상태에서도 캐시 히트로 복원됐다.

**DB 작업 시 주의 — 실제로 걸린 것들**

- **`createServerClient<Database>` 제네릭을 빼먹으면 모든 쿼리 결과가 `any` 가 된다.**
  타입만 생성해두고 제네릭을 안 붙여서 한동안 컬럼명 오타도 통과했다.
  타입 생성 후 잘못된 컬럼명으로 에러가 나는지 반드시 확인할 것.
- 집계 뷰는 **`security_invoker = true`** 필수. 기본값은 뷰 소유자 권한으로 동작해 RLS 를 우회한다.
- **뷰를 추가하면 조인 타입 추론이 깨질 수 있다** — PostgREST 가 뷰에도 FK 관계를 물려줘
  to-one 조인이 배열로 추론된다. 어드민은 `one()` 헬퍼로 흡수.

- **앱과 어드민은 같은 DB를 쓴다.** 앱이 anon key 로 직접 붙으므로 **RLS 가 유일한 방어선.**
  service role key 는 어드민 서버 전용(절대 클라이언트 노출 금지).
- 운영자 권한은 `auth.users.app_metadata.role`. `users` 테이블에 role 컬럼을 두지 않는다.
- 자동 RLS 가 켜져 있어 **새 테이블은 만들자마자 전부 거부(fail-closed)**. 정책을 안 만들면
  쿼리가 빈 결과만 돌아온다 — 버그가 아니다.
- 새 테이블 자동 노출을 껐으므로 **`authenticated` 와 `service_role` 양쪽에 명시적 grant** 필요.
  service_role 은 RLS 를 우회하지만 GRANT 는 별개다(빠뜨리면 전부 403 — 실제로 겪었다).
- **RLS 는 컬럼을 제한하지 못한다.** 특정 컬럼만 수정 허용은 컬럼 단위 grant 로 한다
  (`users` 의 points 자가 수정 차단).
- 생성 컬럼(`generated always as`)에 `timestamptz - interval` 을 쓸 수 없다 — STABLE 이라
  IMMUTABLE 조건 위반. 트리거를 쓴다.

**6단계 진행 중 — 앱(`apps/mobile`, Expo SDK 57)**

`whitenoise-hq/app-dev-playbook` 을 기준으로 세팅했다. 새 앱 세팅·iOS 배포 절차는 그 레포 참조.

**6-1 골격 완료** — Expo Router + 폰트 + TanStack Query + Supabase 클라이언트.
`expo-doctor` 21/21 통과, iOS 번들 빌드 확인.

**6-2 완료 — 화면 전부(목업 데이터)**

로그인 · 온보딩 · 홈(예측) · 예측 · 뽑기 · 도감 · 마이 + 하위 화면(팩 개봉 · 카드 상세 ·
포인트 내역 · 닉네임/응원팀 변경).

- 탭 **5개**(홈·예측·뽑기·도감·마이). 기획서는 4개였는데 예측 기록·성적을 분리했다.
  홈은 **당일 경기만** 보여주고 상단에 어제 결과 한 줄 배너를 둔다.
- 홈 경기 카드는 **3열**(원정/무승부/홈)이고 셀 자체가 선택지다.
  저장은 **경기 카드마다 명시적**(선택만으로 저장하지 않는다) — 헤더 우측 작은 알약.
- **예측 탭은 내가 예측한 경기만** 날짜별로 묶어 보여준다(경기 일정표가 아니다).
  홈과 **같은 3열 그리드**를 쓴다 — 따로 만들었더니 팀명 길이 때문에 콜론 위치가 어긋나
  목록이 삐뚤빼뚤했다. 획득 포인트는 날짜 헤더에 하루 합계로 올렸다.
- **뽑기는 탭(선택) + 전체화면(개봉) 둘로 나눈다.** 탭 바가 보이는 화면에서 개봉하면
  연출에 집중되지 않는다. 개봉은 `choose → ready → cutting → revealed` 4단계이고
  **가로로 밀어 자른다**(위로 당기는 방식은 절단선 개념이 화면에 안 나타나서 버렸다).
  10장 뽑기는 **한 장씩** 넘겨 본다(격자는 결과 요약표처럼 읽혔다).
- **도감은 미보유 카드도 자리를 지킨다**(잠긴 카드). 빈칸이면 몇 장 남았는지 알 수 없어
  수집욕이 안 생긴다. 등급별 진행률은 **필터 칩에 숫자로** 넣었다(요약 카드에 또 두면 층이 늘었다).
- **마이는 "내가 누구고 얼마 있나"까지만.** 나머지는 메뉴로 넘긴다. 메뉴 줄은 `height: 56`
  고정 — 패딩만 주면 값·화살표 유무로 줄마다 높이가 달라져 목록이 들쭉날쭉했다.
- **스코어 예측 입력은 보류**(승패만 받는다). 바텀시트+스텝퍼까지 만들었다가 걷어냈다 —
  적중이 사실상 안 나는데 복잡도가 컸다. **DB·정산·스키마는 그대로**라 켤 때 화면만
  붙이면 된다(앱기획서 4장).
- **중복 자동 환급은 폐지했다.** 중복은 카드로 쌓이고(`count+1`) **도감에서만** 판다.
  뽑기 결과에서 바로 팔게도 만들어 봤지만 걷어냈다 — 개봉 직후는 무엇을 뽑았는지 보는
  순간인데 "파세요" 버튼이 초점을 포인트로 옮긴다(통합기획서 6장).
- **테두리를 쓰지 않는다(전 화면 원칙).** 여백 → 배경 계층 → 그림자 → divider 순으로
  구분하고 `borderWidth` 는 쓰지 않는다. 선택도 배경 틴트(`primaryLight`/`successLight`)로
  알린다. 카드·칸·배지에 각각 선을 뒀더니 "액자 안의 액자"가 되어 정신사나웠다.
  상세는 `docs/04_앱디자인가이드.md` 5장.

**인증 구현 완료(6-5 를 앞당겼다) — 카카오 + 애플**

- `lib/auth.ts` 한 곳에서 로그인·로그아웃을 감싼다. 화면은 `supabase.auth` 를 직접 안 부른다.
- `hooks/useSession.tsx` — 세션은 **TanStack Query 를 쓰지 않는다**(서버 데이터가 아니라
  앱 상태다). 로그아웃 시 **쿼리 캐시를 비운다** — 안 비우면 다른 계정으로 로그인했을 때
  이전 유저의 포인트·도감이 잠깐 보인다.
- `AuthGate`(`app/_layout.tsx`) 가 로그인·온보딩 분기를 **한 곳에서** 판정한다(앱기획서 3.1).
- 온보딩·설정의 닉네임/응원팀 저장은 **실제 `users` update** 다. DB 는 컬럼 단위 grant 로
  `nickname`·`favorite_team_id` 만 허용한다.
- ⚠️ 닉네임은 `is_nickname_available()` RPC 로 확인하지만 **저장의 unique 위반(23505)도
  처리한다** — 확인과 저장 사이에 경합이 있다.

⚠️ **현재 막혀 있는 것**
- **개발 인증서가 없어 네이티브 빌드가 안 된다**(`security find-identity` → 0 identities).
  애플 로그인 entitlement 때문에 시뮬레이터 빌드에도 필요하다(아래 실행 표 참고).
- Expo Go 로는 카카오만 확인 가능하고, 복귀 주소가 `exp://<IP>:8081/--/auth/callback`
  형태라 그 값을 **Supabase Redirect URLs 에 등록**해야 한다(`exp://**` 와일드카드 권장,
  배포 전 제거). 등록 안 하면 Supabase 가 **오류 없이 Site URL 로 폴백**한다.

```
app/
  _layout.tsx        폰트 로드 · Query · Session · AuthGate · Stack 옵션
  login.tsx          카카오 · 애플
  onboarding.tsx     닉네임 → 응원팀 (2스텝)
  points.tsx         포인트 내역
  (tabs)/            _layout.tsx(탭 5개) · index(홈) · predict · draw · dex · my
  pack/[type].tsx    팩 개봉 (전체화면)
  card/[dexNo].tsx   카드 상세 · 여분 판매
  settings/          nickname · team
components/
  ui/                Text(폰트 함정 흡수) · Screen · ScreenHeader · Card · Button ·
                     TextField
  game/              GameCard · PickSegment · PickCell · TeamMark · PredictFooter ·
                     YesterdayBanner · game-status-view
  prediction/        PredictionDay · PredictionRow · RecordCard
  draw/              PackCard · PackImage · CardFace
  dex/               DexCell · DexProgressCard · FilterChipRow
  my/                MenuRow · PointHistory
  profile/           TeamPicker (온보딩·설정 공용)
hooks/               useServerNow · useSession · useProfile
lib/                 env · supabase · auth · query-client · format · nickname
mocks/               games · predictions · draw · dex · profile (⚠️ 6-4 에서 삭제)
theme/               colors(shared 재노출) · fonts · shadow
types/               assets.d.ts · game · prediction · draw · dex · card · profile
assets/packs/        팩 이미지(상단/하단 분리) + source/ 원본
assets/images/       icon · splash-icon (뽑기 탭 sparkles 글리프로 생성)
metro.config.js
```

**앱 실행 — `ios` 와 `ios:build` 는 다른 명령이다**

| 명령 | 하는 일 |
| --- | --- |
| `pnpm --filter @kbokkang/mobile start` | Metro 만. **이미 설치된 개발 빌드**에 붙는다 |
| `pnpm --filter @kbokkang/mobile ios` | `expo start --ios` — **Expo Go** 로 연다 |
| `pnpm --filter @kbokkang/mobile ios:build` | `expo run:ios --device "iPhone 17 Pro"` — **네이티브 빌드** |

⚠️ **시뮬레이터를 `--device` 로 못 박아 뒀다.** 지정하지 않으면 `expo run:ios` 가
**Mac 타깃**으로 붙어 `No code signing certificates are available to use` 로 실패한다
(연결된 실기기가 없어도 그렇다 — 겪었다).

⚠️⚠️ **애플 로그인 entitlement 는 시뮬레이터 빌드에도 개발 인증서를 요구한다.**
Expo CLI 가 `com.apple.developer.applesignin` 을 그런 목록에 넣어 뒀다. Xcode →
Settings → Accounts 에 Apple ID 를 넣고 **Apple Development** 인증서를 만들어야
`ios:build` 가 통과한다(무료 계정도 발급된다).
`security find-identity -v -p codesigning` 으로 확인한다.

⚠️⚠️ **Expo Go 에는 우리가 넣은 네이티브 모듈이 없다.** 그러면 기능이 오류도 없이
**조용히 사라진다** — 애플 로그인 버튼이 안 보여서 한참 찾았다. 네이티브 의존성을
추가·변경했으면 `ios:build` 로 다시 빌드해야 반영된다.
- 그래서 **감추는 이유를 개발 콘솔에 찍는다**(`lib/auth.ts` 의 `warnAppleUnavailable`).
  조용히 감추면 원인이 셋(모듈 없음 / 기기 미지원 / 플랫폼 다름)이라 짚을 수 없다.

⚠️⚠️ **네이티브 모듈을 파일 최상단에서 `import` 하지 말 것.** `expo-apple-authentication`
은 로드 시 `requireNativeModule` 을 부르는데, 모듈이 없는 빌드에서는 **import 시점에
터진다.** 그 파일이 루트 레이아웃으로 이어져 있어 **앱이 아예 안 떴다**(겪었다).
`await import(...)` + try/catch 로 **필요할 때만** 불러온다.

남은 순서: 6-3 서버 RPC → 6-4 연결(목업 제거) → 6-6 iOS 빌드.
(6-5 인증은 6-2 중에 앞당겨 구현했다.)

**앱 작업 시 주의 — 실제로 걸린 것들**

- ⚠️⚠️ **React 는 워크스페이스에 한 버전만.** `node-linker=hoisted` 라 버전이 갈리면
  RN 패키지마다 자기 react 사본이 생긴다(실측 32곳) — "Invalid hook call" 의 전형적 원인.
  `react-native` peer 가 `^19.2.3` 이라 **19.2.8 로 통일**하고 루트 `pnpm.overrides` 로 고정했다.
  `expo-doctor` 가 이걸 잡아준다 — 세팅 후 반드시 돌릴 것.
  - `apps/mobile/package.json` 의 `expo.install.exclude` 에 `react`·`typescript` 를 넣어
    `expo install --check` 가 되돌리지 못하게 했다(typescript 는 워크스페이스가 5.9.3 고정).
- ⚠️ **모노레포는 `metro.config.js` 가 필요하다.** 기본 설정은 앱 폴더만 감시해서
  `@kbokkang/shared`·`@kbokkang/assets` 를 번들하지 못한다. `watchFolders` 에 워크스페이스
  루트, `nodeModulesPaths` 에 루트 `node_modules` 를 넣는다.
- ⚠️ **SDK 57 에는 `babel.config.js` 가 없다.** 플레이북은 reanimated 4 용
  `react-native-worklets/plugin` 을 수동 추가하라고 하지만, SDK 57 `babel-preset-expo` 가
  자동 포함한다(템플릿이 babel 설정 없이 동작하는 것이 근거). 수동 추가는 중복 적용 위험.
- ⚠️ **`app.json` 에 `newArchEnabled` 를 쓰지 말 것.** SDK 57 에서 제거된 속성이다
  (신아키텍처가 기본). 넣으면 `expo-doctor` 가 스키마 오류로 잡는다.
- ⚠️ **커스텀 폰트에 `fontWeight` 를 주면 시스템 폰트로 폴백된다.** 굵기별 파일이 별도
  패밀리로 등록되기 때문이다. 화면에서 RN `Text` 를 직접 쓰지 말고 `components/ui/Text.tsx`
  를 쓴다(토큰 → 패밀리 변환을 거기서 한 번만 한다).
- ⚠️ **에셋 타입 선언은 직접 둔다**(`types/assets.d.ts`). Expo 가 만드는 `expo-env.d.ts` 는
  gitignore 되고 `expo start` 전에는 없어서, 그것만 믿으면 깨끗한 체크아웃에서 타입체크가 깨진다.
- ⚠️ **`.env` 를 바꾸면 `--clear` 가 필요하다.** `EXPO_PUBLIC_*` 는 빌드 시점에 번들로
  인라인되므로 캐시가 남으면 옛 값이 계속 쓰인다.
- ⚠️⚠️ **Hermes 에 없는 최신 API 를 쓰지 말 것.** `Array.prototype.toSorted` 로 예측 탭이
  `undefined is not a function` 으로 죽었다 — **타입체크·lint·번들 export 가 전부 통과하고
  앱을 켜야** 드러난다(tsconfig 의 lib 는 ESNext, Metro 는 트랜스파일만 한다).
  루트 `eslint.config.mjs` 에 `toSorted`/`toReversed`/`toSpliced`/`Object.groupBy` 금지
  규칙을 넣어 뒀다(앱·shared 에만 적용. Node 에서 도는 어드민·크롤러는 무관).
  복사 후 기존 메서드를 쓴다: `[...arr].sort(...)`.
- 화면에서 `supabase` 를 직접 부르지 않는다 — `hooks/` 의 TanStack Query 훅으로만 접근(플레이북).

**앱 디자인 (확정)**

- 토스 스타일. **라이트 고정**(다크모드 없음). 아이콘 Ionicons 만, **이모지 금지**.
- ⚠️ **화면 배경은 `surface`(연회색), 카드·탭 바는 `background`(흰색)** — 토큰 이름과 반대다.
  이름대로 화면을 흰색으로 두면 카드·탭 바까지 전부 흰색이라 아무것도 구분되지 않는다
  (어드민에서 겪은 것과 같은 문제).
- ⚠️⚠️ **테두리(`borderWidth`)를 쓰지 않는다 — 전 화면 원칙.** 구분은 여백 → 배경 계층 →
  그림자 → 얇은 divider 순이고, 선택·강조도 **배경 틴트**로 알린다(가이드 5장).
  - 유일한 예외는 **탭 바 상단 선 한 줄**이고 거기에만 `borderStrong`(#D1D6DB)을 쓴다.
    `border`(#E5E8EB)는 카드 안 divider 색이다. `textDisabled` 를 선으로 쓰지 말 것.
  - **알약 배지도 쓰지 않는다.** 상태는 글자색으로 알린다.
- ⚠️ **`Button` 의 `secondary` 를 회색 화면(`surface`) 위에 쓰지 말 것.** 배경이 `surface` 라
  화면과 같은 색이 되어 **버튼으로 보이지 않는다**(도감 상세 판매 버튼이 그랬다).
  흰 카드 안이나 어두운 배경(뽑기 개봉) 전용이다.
- ⚠️ **화면 옵션(`presentation` 등)을 화면 컴포넌트 안에서 `<Stack.Screen options>` 로
  주지 말 것.** 리렌더마다 옵션이 다시 적용돼 **화면이 재마운트**되고 `useState` 가 날아간다
  (개봉 화면에서 장수를 골라도 처음 상태로 돌아갔다). `app/_layout.tsx` 에 선언한다.
- ⚠️ **전체 폭 세그먼트에 `scale` 눌림 효과를 쓰지 말 것.** 중앙 기준 축소로 위아래에 틈이
  생겨 깜빡인다(겪었다). 배경색 변화로 대체한다.
- ⚠️ **탭 바에 중앙 강조 버튼을 넣지 말 것.** 시도했는데 혼자 튀어나와 열이 맞지 않았다.
  가이드 7.1 의 "뽑기만 화려하다"는 **뽑기 화면**에 대한 것이고 탭 바가 아니다.
- **뽑기만 화려하다 — 의도된 예외.** 홈·도감·마이는 심심하게 두고 드라마를 뽑기에 몰아넣는다.
  뽑기의 화려함을 다른 화면으로 가져오면 토스 감성이 깨지고 뽑기 임팩트도 죽는다.
- 뽑기 = **카드팩 개봉**(포켓몬 TCG Pocket 방식). 팩 캐러셀 → 스와이프로 자르기 →
  빛 방사 → 카드 솟아오름. 10연차는 팩 10개 일괄 자르기, 최고 등급을 마지막 순서로.
  상세 스펙·필요 에셋은 `docs/04_앱디자인가이드.md` 7장.
- 인증: **카카오(웹 OAuth) + 애플(네이티브)**. 소셜을 제공하면 Apple 도 필수(App Store 4.8).
  브랜드 버튼 색·문구는 사업자 가이드를 따르므로 **디자인 토큰의 예외**다 —
  그 색을 `packages/shared/theme.ts` 에 넣지 않는다(다른 화면에 번지지 않게).
- ⚠️ 닉네임은 `public.users.nickname` + `is_nickname_available()` RPC 를 쓴다.
  플레이북은 `user_metadata` 를 권하지만 그러면 **중복 체크가 불가능**하다.

**예측 규칙 (변경됨 — 주의)**

- ⚠️⚠️ **예측은 홈/무승부/원정 3택이다.** 처음엔 2택이고 "무승부면 전원 미적중"이었는데,
  KBO 는 무승부가 실제로 있어서(실측 3:3, 0:0) 그 경기 예측자 전원이 손해를 봤다.
  - `settle_game()` 은 실제 결과를 `prediction_pick` 과 같은 형태로 만들어 **단순 비교**로
    판정한다. 기존 불리언 비교(`(pick='home') <> home_won`)로는 3택을 표현할 수 없다.
  - 무승부 적중 포인트는 승패와 **동일하게 30**.
  - ⚠️ **enum 에 값을 추가하면 타입 검사가 안 잡아주는 곳이 있다.** 어드민에서 두 건 겪었다:
    `awayPicks = 전체 - homePicks`(무승부가 원정에 섞임), `pick === 'home' ? A : B`(무승부가
    원정으로 표시됨). **뺄셈으로 나머지를 구하거나 이항 삼항식을 쓰지 말 것.**
- ⚠️ **예측 마감 = 경기 시작 30분 전**(처음엔 1시간 전). KBO 가 타순을 시작 1~1.5시간 전에
  발표하므로 1시간 전이면 라인업을 보고 예측할 시간이 없었다.
  - 마감 검증은 세 곳에 있고 **모두 `games.predict_close_at` 컬럼 기준**이다:
    트리거 / `predictions_insert_own` RLS(`now() < g.predict_close_at`) / 앱의 `gamePhaseOf`.
  - `PREDICT_CLOSE_OFFSET_MINUTES` 는 **표시용 상수**다(어드민 규칙 화면). 진짜 출처는 트리거.
  - ⚠️ 크롤러 게이트의 1시간 리드는 **마감과 별개**다. 마감보다 먼저 열려야 우천 취소가
    마감 전에 반영된다.

**앱에 필요한데 아직 없는 것 (6-3)**

- `delete_account` RPC — **App Store 5.1.1(v) 필수.** 없으면 리젝된다.
  `users`·`user_cards`·`predictions`·`draws`·`point_transactions` 를 전부 정리해야 한다.
  auth 유저까지 지워야 하므로 **클라이언트에서 처리할 수 없다**(service role 필요).
  지금 마이 화면은 확인 창까지만 뜨고 "준비 중" 안내를 띄운다.
- `draw_cards` RPC — 뽑기. ⚠️⚠️ **지금 목업은 클라이언트에서 확률을 굴린다**
  (`mocks/draw.ts`). 그대로 두면 결과 조작이 가능하고 포인트 차감·수량 증가가
  **DB 트랜잭션 밖**에서 일어난다. 반드시 서버로 옮긴다.
  - 중복이면 `user_cards.count + 1`, **환급은 하지 않는다**(통합기획서 6장).
- `sell_card` RPC — 여분 판매(`user_cards` 에 delete 권한이 없어 RPC 가 필요).
  **수량 확인(마지막 1장 보호)과 포인트 지급이 한 트랜잭션**이어야 한다.
- ~~예측 마감 검증~~ — 확인 완료. `predictions_insert_own` RLS 정책에 이미 있다.
- ~~인증(6-5)~~ — 6-2 중에 앞당겨 구현했다. 남은 것은 **개발 인증서**뿐이다.

**미결**

- **개발 인증서** — Xcode 에 Apple ID 를 넣고 Apple Development 인증서를 만들어야
  `ios:build` 가 통과한다. 그전까지 애플 로그인은 확인할 수 없다.
- **카드 이미지가 한 장도 없다.** `CardFace` 가 등급색 자리표시 프레임을 그린다.
  실제 이미지가 들어오면 같은 자리에 들어가고 글자 위치는 그대로다.
- **방사형 빛·스파클 PNG**(가이드 7.3) — 개봉 연출의 빛은 흰 도형으로 근사해 뒀다.
- **`expo-haptics` 미설치** — 개봉 진동이 없다(가이드 7.1 ④).
- 10연차 할인율 확정, 구단 로고 사용 리스크 판단, 카드 생성 프롬프트 확정,
  카드 프레임 레이아웃(통이미지 위 이름·번호·등급 배지 배치).
