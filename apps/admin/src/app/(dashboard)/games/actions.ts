'use server'

import { revalidatePath } from 'next/cache'
import { gameSettleSchema } from '@kbokkang/shared'
import { repositories } from '@/lib/repositories'

/**
 * 수동 정산 — 크롤링 실패/오류 시 운영자가 결과를 직접 입력한다.
 *
 * 주의: 실제 DB 연결 후에는 스코어 저장에서 끝나지 않는다.
 * predictions.result / earned_points 확정 + 포인트 지급 + point_transactions 기록까지
 * 한 트랜잭션으로 묶어야 한다(3단계 검토 항목).
 */
export const settleGame = async (raw: unknown): Promise<{ ok: boolean; message: string }> => {
  const parsed = gameSettleSchema.safeParse(raw)

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues.map((issue) => issue.message).join(', ') }
  }

  try {
    const { gameId, homeScore, awayScore } = parsed.data
    const game = await repositories.games.findById(gameId)

    if (game === null) return { ok: false, message: '경기를 찾을 수 없습니다' }
    if (game.status === 'settled') {
      return { ok: false, message: '이미 정산이 완료된 경기입니다' }
    }
    if (game.status === 'scheduled') {
      return { ok: false, message: '아직 시작하지 않은 경기는 정산할 수 없습니다' }
    }

    await repositories.games.settle(gameId, homeScore, awayScore)
    revalidatePath('/games')
    revalidatePath(`/games/${gameId}`)
    revalidatePath('/')

    return { ok: true, message: `정산 완료 (${String(awayScore)} : ${String(homeScore)})` }
  } catch (error) {
    console.error('수동 정산 실패:', error)
    return { ok: false, message: '정산에 실패했습니다' }
  }
}
