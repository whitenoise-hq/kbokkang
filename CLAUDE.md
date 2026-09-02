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
- 백엔드: Supabase (DB + Auth + Storage). 크롤링/정산: GitHub Actions cron.

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

**5단계 완료 — 크롤링/정산 (`apps/crawler` + GitHub Actions)**

- 데이터 소스: **네이버 스포츠 `api-gw`**. 조사 근거와 소스 신뢰 방침은 통합기획서 3장.
  소스 규칙 코드는 `packages/shared/kbo-source.ts` (2026 시즌 843경기로 확인).
- 액션 2개: 일정 `0 1 * * 1`(월 KST 10:00, 실행일 포함 7일) /
  정산 `0,30 1-15 * * *`(매일 KST 10:00~24:30). 둘 다 `--date` 인자로 복구 실행 가능.
- Actions Secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 등록됨.
- 실연결 검증: 9/1~9/7 30경기 수집, 8/25 5경기 정산(3:3 무승부 포함), 3회 실행 멱등성,
  Actions 양쪽 워크플로 수동 실행 성공.

**크롤러 작업 시 주의**

- ⚠️ **`crawl_runs.target_date` 는 "이 날짜를 수집했다"는 뜻.** 여러 날짜를 수집하면
  **날짜마다 한 행**을 남겨야 한다. 시작일 한 행만 남겼더니 나머지 6일이 어드민에서
  "수집 이력 없음"으로 보였다. 경기 0건인 날짜도 행을 남긴다(그게 "경기 없는 날"의 증거).
- 승패는 소스의 `winner` 를 쓰지 않고 스코어로 판정한다. 취소 경기는 0:0 으로 오므로
  스코어를 null 로 남긴다.
- 소스 `gameDateTime` 에 타임존 표기가 없다 — KST 로 해석해야 한다.
- 응답 구조가 어긋나면 **실패시킨다.** 추측해서 채우면 스코어가 0 으로 들어간다.
- 워크플로 트리거에 `pull_request` 를 추가하지 않는다 — public 레포라 외부인이 PR 로
  시크릿을 빼갈 수 있다. `schedule` + `workflow_dispatch` 만 둔다.

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
