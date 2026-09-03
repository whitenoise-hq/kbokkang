import type { Client } from './repository.ts'

/**
 * 실행 게이트 — "지금 소스를 부를 가치가 있나?"
 *
 * cron 은 고정 간격으로 돌지만 **실제 일은 의미 있는 시각에만** 한다.
 * 판단을 cron 스케줄이 아니라 여기(코드)에 두는 이유:
 * - cron 을 동적으로 다시 등록하면 상태가 cron 테이블에 생긴다. 등록이 실패하면
 *   그날 정산이 아예 안 돌고, 해제가 실패하면 계속 돈다.
 * - 게이트는 상태가 없고 테스트할 수 있다. 잘못 판단해도 다음 실행이 다시 판단한다.
 *
 * 통과 조건 — 하나라도 맞으면 일한다:
 *
 * 1. **오늘(KST) 안에 성공 실행이 없었다** — 하루 첫 실행.
 *    일정 수집 + 어제 미정산 복구를 하고, 경기 없는 날은 여기서 한 번만 확인하고 끝난다.
 *
 *    ⚠️ `target_date` 가 아니라 **`run_at`** 으로 판정한다. 주간 일정 잡이 7일치 행을
 *    **미리** 써두기 때문에 `target_date` 로 보면 "오늘 기록 없음"이 성립하지 않는다.
 *    그러면 주중에 더블헤더가 추가돼도 다음 월요일까지 못 잡는다.
 * 2. **창 안에 미정산 경기가 있고, 그중 하나가 시작 1시간 전을 지났다** —
 *    시작 1시간 전부터는 우천 취소·시각 변경이 확정되고, 시작 후에는 결과가 나온다.
 *    (1시간 = 예측 마감 시점. `games.predict_close_at` 과 같은 기준)
 *
 * 그 외에는 건너뛴다: 오늘 경기가 아직 한참 남았거나, 창 안이 전부 정산 완료거나,
 * 경기 없는 날이다.
 */

/** 예측 마감과 같은 기준. 이때부터 일정이 확정된다고 본다. */
const PREGAME_LEAD_MS = 60 * 60 * 1000

export interface GateDecision {
  readonly shouldRun: boolean
  /** 로그용 — 왜 돌았는지/건너뛰었는지 */
  readonly reason: string
}

export const shouldRunSettle = async (
  supabase: Client,
  { from, to, now }: { from: string; to: string; now: Date },
): Promise<GateDecision> => {
  // KST 하루의 시작. `to` 가 KST 날짜이므로 +09:00 을 붙여 경계를 만든다.
  const dayStart = `${to}T00:00:00+09:00`

  const { data: runs, error: runsError } = await supabase
    .from('crawl_runs')
    .select('id')
    .eq('success', true)
    .gte('run_at', dayStart)
    .limit(1)

  if (runsError !== null) throw new Error(`실행 이력 조회 실패: ${runsError.message}`)

  if ((runs ?? []).length === 0) {
    return { shouldRun: true, reason: `${to} 첫 실행 — 일정 수집 + 미정산 복구` }
  }

  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('start_at')
    .gte('game_date', from)
    .lte('game_date', to)
    .neq('status', 'settled')
    .order('start_at')

  if (gamesError !== null) throw new Error(`경기 조회 실패: ${gamesError.message}`)

  const pending = games ?? []

  if (pending.length === 0) {
    return { shouldRun: false, reason: `${from} ~ ${to} 전부 정산 완료` }
  }

  const threshold = now.getTime() + PREGAME_LEAD_MS
  const due = pending.filter((game) => Date.parse(game.start_at) <= threshold)

  if (due.length === 0) {
    const next = pending[0]
    return {
      shouldRun: false,
      reason: `가장 이른 미정산 경기가 아직 1시간 넘게 남음 (${next === undefined ? '?' : next.start_at})`,
    }
  }

  return { shouldRun: true, reason: `미정산 ${String(due.length)}경기가 처리 구간에 들어옴` }
}
