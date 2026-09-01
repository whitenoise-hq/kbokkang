'use server'

import { revalidatePath } from 'next/cache'
import { cardInputSchema } from '@kbokkang/shared'
import { repositories } from '@/lib/repositories'

/**
 * 카드 등록/수정/삭제 서버 액션.
 * 도감번호 부여는 서버에서만 계산한다(클라이언트 입력 신뢰 금지).
 */

export interface ActionResult {
  readonly ok: boolean
  readonly message: string
  /** 등록 성공 시 부여된 도감번호 */
  readonly dexNo?: string
}

const parseInput = (raw: unknown) => {
  const parsed = cardInputSchema.safeParse(raw)

  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => issue.message).join(', ')
    throw new Error(detail)
  }

  return parsed.data
}

export const createCard = async (raw: unknown): Promise<ActionResult> => {
  try {
    const created = await repositories.cards.create(parseInput(raw))
    revalidatePath('/cards')
    revalidatePath('/')

    return { ok: true, message: `${created.dexNo} 등록 완료`, dexNo: created.dexNo }
  } catch (error) {
    console.error('카드 등록 실패:', error)
    return {
      ok: false,
      message: error instanceof Error ? error.message : '카드 등록에 실패했습니다',
    }
  }
}

/**
 * 일괄 등록. 도감번호는 배열 순서대로 서버에서 부여된다.
 * create_cards_bulk RPC 로 한 트랜잭션에 처리한다 — 전부 성공하거나 전부 롤백된다.
 */
export const createCardsBulk = async (rawList: readonly unknown[]): Promise<ActionResult> => {
  try {
    if (rawList.length === 0) return { ok: false, message: '등록할 카드가 없습니다' }

    const inputs = rawList.map(parseInput)
    const created = await repositories.cards.createMany(inputs)

    revalidatePath('/cards')
    revalidatePath('/')

    const first = created.at(0)
    const last = created.at(-1)
    const range =
      first !== undefined && last !== undefined && created.length > 1
        ? ` (${first.dexNo}–${last.dexNo})`
        : first !== undefined
          ? ` (${first.dexNo})`
          : ''

    return { ok: true, message: `${created.length}장 등록 완료${range}` }
  } catch (error) {
    console.error('카드 일괄 등록 실패:', error)
    return {
      ok: false,
      message: error instanceof Error ? error.message : '카드 일괄 등록에 실패했습니다',
    }
  }
}

export const updateCard = async (id: string, raw: unknown): Promise<ActionResult> => {
  try {
    const updated = await repositories.cards.update(id, parseInput(raw))
    revalidatePath('/cards')
    revalidatePath(`/cards/${id}`)

    return { ok: true, message: `${updated.dexNo} 수정 완료`, dexNo: updated.dexNo }
  } catch (error) {
    console.error('카드 수정 실패:', error)
    return {
      ok: false,
      message: error instanceof Error ? error.message : '카드 수정에 실패했습니다',
    }
  }
}

export const deleteCard = async (id: string): Promise<ActionResult> => {
  try {
    await repositories.cards.softDelete(id)
    revalidatePath('/cards')
    revalidatePath('/')

    return { ok: true, message: '카드를 삭제했습니다' }
  } catch (error) {
    console.error('카드 삭제 실패:', error)
    return { ok: false, message: '카드 삭제에 실패했습니다' }
  }
}

export const restoreCard = async (id: string): Promise<ActionResult> => {
  try {
    await repositories.cards.restore(id)
    revalidatePath('/cards')
    revalidatePath(`/cards/${id}`)

    return { ok: true, message: '카드를 복구했습니다' }
  } catch (error) {
    console.error('카드 복구 실패:', error)
    return { ok: false, message: '카드 복구에 실패했습니다' }
  }
}
