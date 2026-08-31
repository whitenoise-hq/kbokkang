'use server'

import { revalidatePath } from 'next/cache'
import { teamUpdateSchema } from '@kbokkang/shared'
import { repositories } from '@/lib/repositories'

/**
 * 구단 수정. KBO 10개 구단은 고정이라 생성/삭제 없이 수정만 제공한다.
 *
 * 로고는 앱 온보딩(응원팀 선택)과 경기 화면 전반에서 쓰이므로
 * 여기서 등록한 값이 앱까지 그대로 내려간다.
 */
export const updateTeam = async (raw: unknown): Promise<{ ok: boolean; message: string }> => {
  const parsed = teamUpdateSchema.safeParse(raw)

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues.map((issue) => issue.message).join(', ') }
  }

  try {
    const { id, name, shortName, color, logoUrl } = parsed.data
    const team = await repositories.teams.findById(id)

    if (team === null) return { ok: false, message: '구단을 찾을 수 없습니다' }

    await repositories.teams.update(id, { name, shortName, color, logoUrl })

    // 로고·컬러가 여러 화면에 쓰이므로 함께 갱신
    revalidatePath('/teams')
    revalidatePath('/games')
    revalidatePath('/users')
    revalidatePath('/')

    return { ok: true, message: `${shortName} 저장 완료` }
  } catch (error) {
    console.error('구단 수정 실패:', error)
    return { ok: false, message: '구단 수정에 실패했습니다' }
  }
}
