/**
 * 도감번호(dex_no) 규칙 — 통합기획서 4.4 기준.
 * 형식: 등급 접두어 + 2자리 숫자 (N01, R07, E12, L03, M01)
 * 부여는 어드민에서 자동 처리. 수동 입력 금지(중복 방지).
 */

import { CARD_GRADE_BY_PREFIX, CARD_GRADE_META, type CardGrade } from './grades'

export const DEX_NO_SEQ_DIGITS = 2

export const DEX_NO_PATTERN = /^([NRELM])(\d{2})$/

export interface DexNo {
  readonly grade: CardGrade
  /** 등급 내 순번 (1부터) */
  readonly seq: number
}

/** 등급 + 순번 → 도감번호 문자열. 순번은 1 이상, 2자리를 넘기면 자리수만큼 늘어난다. */
export const formatDexNo = ({ grade, seq }: DexNo): string => {
  if (!Number.isInteger(seq) || seq < 1) {
    throw new Error(`도감번호 순번이 올바르지 않습니다: ${String(seq)} (1 이상의 정수 필요)`)
  }

  return `${CARD_GRADE_META[grade].prefix}${String(seq).padStart(DEX_NO_SEQ_DIGITS, '0')}`
}

/** 도감번호 문자열 → 등급 + 순번. 형식이 틀리면 null. */
export const parseDexNo = (dexNo: string): DexNo | null => {
  const matched = DEX_NO_PATTERN.exec(dexNo)
  if (!matched) return null

  const [, prefix, seqText] = matched
  if (prefix === undefined || seqText === undefined) return null

  const grade = CARD_GRADE_BY_PREFIX[prefix]
  if (grade === undefined) return null

  return { grade, seq: Number(seqText) }
}

/**
 * 해당 등급의 다음 도감번호를 계산한다.
 * @param grade 대상 등급
 * @param existingCount 해당 등급에 이미 등록된 카드 수
 *
 * 주의: 실제 부여는 동시 등록 경합을 막기 위해 DB 트랜잭션(또는 유니크 제약 + 재시도)
 * 안에서 수행해야 한다. 이 함수는 계산만 담당한다.
 */
export const nextDexNo = (grade: CardGrade, existingCount: number): string =>
  formatDexNo({ grade, seq: existingCount + 1 })
