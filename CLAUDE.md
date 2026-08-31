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
2. **어드민 화면(apps/admin)** — 목업 데이터로 UI 먼저. 카드 목록/등록 폼 우선. DB 미연결.
3. **스키마 확정 + Supabase 세팅** — 2단계에서 드러난 요구를 통합기획서 5장에 반영 후 확정
4. 어드민 ↔ Supabase 연결(목업 → 실데이터, RLS·권한)
5. 크롤링/정산(GitHub Actions)
6. 앱(apps/mobile) — 여기도 화면 먼저, 연결 나중

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
- 데이터는 `apps/admin/src/lib/repositories`의 fixture 기반 in-memory 구현.
  4단계에서 `supabase` 구현으로 교체하면 화면 코드는 수정하지 않는다.
- `apps/mobile`은 6단계라 미생성.

**Supabase 프로젝트 생성 + 인증 연결 완료**

- 프로젝트 `iwggqsjrkjwkpuakunmc` (Seoul). Data API 켬 / 새 테이블 자동 노출 끔 / 자동 RLS 켬.
- 로그인·로그아웃·미들웨어 가드가 **실제 Supabase Auth 에 붙어 동작한다**(어드민 기획서 5장).
- ⚠️ **인증만 실연결.** 카드·유저·경기·구단 데이터는 여전히 fixture(in-memory).
  스키마가 없으므로 정상 상태다.

**다음: 3단계 — 스키마 확정 + 마이그레이션**

- **앱과 어드민은 같은 Supabase 프로젝트·같은 DB를 쓴다.** 앱이 anon key 로 직접 붙으므로
  **RLS 가 유일한 방어선.** service role key 는 어드민 서버 전용(절대 클라이언트 노출 금지).
- 운영자 권한은 `auth.users.app_metadata.role`. `users` 테이블에 role 컬럼을 두지 않는다
  (`user_metadata` 는 유저가 수정 가능하므로 권한에 못 쓴다 — 통합기획서 5장 참조).
- 자동 RLS 가 켜져 있어 **새 테이블은 만들자마자 전부 거부(fail-closed)** 된다.
  정책을 안 만들면 쿼리가 빈 결과만 돌아온다 — 버그가 아니다.
- 새 테이블 자동 노출을 껐으므로 마이그레이션에 **명시적 grant** 가 필요하다.
- 화면 작업에서 확정/추가된 컬럼: `cards.image_url` nullable, `cards.deleted_at`,
  `teams.short_name`, `point_transactions.memo`. `crawl_runs` 테이블은 도입 검토 중.
- 트랜잭션 필수 4곳(도감번호 부여·일괄 등록·정산·뽑기)은 통합기획서 5장 표 참조.

미결: KBO 결과 API 조사, 10연차 할인율 확정, 크롤링 레포 public/private, `crawl_runs` 도입 여부.
