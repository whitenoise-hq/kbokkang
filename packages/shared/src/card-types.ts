/**
 * 카드 종류 정의 — 통합기획서 4.2 기준.
 * 모두 오리지널 가상 캐릭터/사물. 실존 선수·구단 요소 사용 금지.
 */

export const CARD_TYPES = ['player', 'mascot', 'item'] as const

export type CardType = (typeof CARD_TYPES)[number]

export const CARD_TYPE_LABEL: Record<CardType, string> = {
  player: '선수',
  mascot: '마스코트',
  item: '아이템',
} as const

export const isCardType = (value: unknown): value is CardType =>
  typeof value === 'string' && (CARD_TYPES as readonly string[]).includes(value)
