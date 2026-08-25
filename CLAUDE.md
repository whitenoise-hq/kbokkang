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
- **폰트(Pretendard)는 `packages/assets/fonts/pretendard/`에 파일로 보관.** npm 패키지 설치 금지(97MB, RN에서 못 씀).
  - 웹(admin): `web/*.woff2` — `next/font/local`로 참조.
  - 앱(mobile): `native/*.otf` — RN은 woff2 불가.
  - 굵기는 Regular(400)/SemiBold(600)/Bold(700) 3종만. 라이선스 OFL 1.1, `LICENSE.txt` 동봉 유지.

## 현재 상태

- 기획 완료. **1단계(모노레포 환경설정) 완료** — Turborepo + pnpm, `apps/admin`(Next 16/React 19/Tailwind 4/shadcn 전제), `packages/shared`(상수·디자인 토큰·zod 스키마, 테스트 52개), `packages/assets`(Pretendard).
- 다음: **2단계 어드민 화면(UI)** — 목업 데이터로 구현. `apps/mobile`은 6단계라 미생성.
- **스키마는 아직 확정 아님**(통합기획서 5장 초안). 화면 작업 중 변경 필요하면 문서를 먼저 고칠 것.
- 미결: KBO 결과 API 조사, 10연차 할인율 확정, 크롤링 레포 public/private, 등급 변경 시 도감번호 재부여 정책.
