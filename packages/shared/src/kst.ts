/**
 * KST 날짜 계산 — 앱·어드민 공용.
 *
 * DB 의 시각은 UTC(`timestamptz`)이고 화면·집계 기준은 항상 **KST** 다.
 * `getFullYear()` 류로 조립하면 **기기·서버 로컬 타임존 기준**이 되어 자정 전후로
 * 하루가 밀린다(어드민은 Vercel = UTC 에서 돌기 때문에 실제로 밀린다).
 *
 * 크롤러도 같은 방식을 쓴다(`supabase/functions/_shared/date.ts` 의 `todayKst`).
 * 그쪽은 Deno/Node 양쪽에서 도는 독립 모듈이라 의존을 만들지 않고 따로 두었다.
 */

export const KST_OFFSET_MS = 9 * 60 * 60 * 1000

/**
 * KST 기준 날짜 — `2026-09-07`.
 *
 * 오프셋을 더한 뒤 UTC 로 읽는다. KST 는 서머타임이 없으므로 정확하다.
 * `Intl` 로 `YYYY-MM-DD` 를 만들려면 `en-CA` 같은 **로케일에 의존**해야 한다.
 */
export const kstDateOf = (date: Date): string =>
  new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10)
