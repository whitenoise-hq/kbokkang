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
6. 앱(apps/mobile) — 여기도 화면 먼저, 연결 나중 — ⬅️ 다음

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
- `apps/mobile`은 6단계라 미생성.

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
  첫 경기 시작 1시간 전부터 전 경기 정산 완료까지만 소스를 부른다. 하루 소스 호출 ~7회.
- **pg_cron 은 정확하다(실측):** 09-03 하루 30분마다 정확히 발화(`16:30:00.116` 등),
  결번·지연 0. GitHub Actions 가 30회 중 2~4회였던 것과 대조된다.

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

**다음: 6단계 — 앱(`apps/mobile`, Expo).** 여기도 화면 먼저, 연결 나중.

미결: 10연차 할인율 확정, 구단 로고 사용 리스크 판단, 카드 생성 프롬프트 확정.
