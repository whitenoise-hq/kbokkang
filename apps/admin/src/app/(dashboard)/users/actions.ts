'use server'

import { revalidatePath } from 'next/cache'
import { pointAdjustSchema } from '@kbokkang/shared'
import { repositories } from '@/lib/repositories'

/** 운영자 포인트 수동 지급/차감. reason=admin_adjust 로 기록되고 사유가 필수다. */
export const adjustUserPoints = async (raw: unknown): Promise<{ ok: boolean; message: string }> => {
  const parsed = pointAdjustSchema.safeParse(raw)

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues.map((issue) => issue.message).join(', ') }
  }

  try {
    const { userId, amount, memo } = parsed.data
    const user = await repositories.users.findDetail(userId)

    if (user === null) return { ok: false, message: '유저를 찾을 수 없습니다' }
    if (user.points + amount < 0) {
      return { ok: false, message: `차감 후 포인트가 음수가 됩니다 (현재 ${user.points}p)` }
    }

    await repositories.users.adjustPoints(userId, amount, memo)
    revalidatePath(`/users/${userId}`)
    revalidatePath('/users')

    return {
      ok: true,
      message: `${amount > 0 ? '지급' : '차감'} 완료 (${amount > 0 ? '+' : ''}${amount}p)`,
    }
  } catch (error) {
    console.error('포인트 조정 실패:', error)
    return { ok: false, message: '포인트 조정에 실패했습니다' }
  }
}
