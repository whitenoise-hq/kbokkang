/**
 * 뽑기 규칙 — 통합기획서 6장.
 * 실제 추첨은 반드시 서버에서 수행한다(클라이언트 신뢰 금지).
 * 이 파일은 비용/확률 테이블과 검증 유틸만 제공한다.
 */

import { CARD_GRADES, type CardGrade } from './grades'

export const DRAW_TYPES = ['normal', 'premium'] as const

export type DrawType = (typeof DRAW_TYPES)[number]

export const DRAW_TYPE_LABEL: Record<DrawType, string> = {
  normal: '일반 뽑기',
  premium: '프리미엄 뽑기',
} as const

/** 10연차 장수 */
export const TEN_DRAW_COUNT = 10

/** 1회 비용 */
export const DRAW_COST_SINGLE: Record<DrawType, number> = {
  normal: 100,
  premium: 300,
} as const

/** 10연차 비용 (할인 적용, 초안 — 할인율 확정 필요) */
export const DRAW_COST_TEN: Record<DrawType, number> = {
  normal: 950,
  premium: 2850,
} as const

export const drawCost = (type: DrawType, count: 1 | typeof TEN_DRAW_COUNT): number =>
  count === TEN_DRAW_COUNT ? DRAW_COST_TEN[type] : DRAW_COST_SINGLE[type]

/**
 * 등급 확률(%) — 합계 100. 등급 확정 후 등급 내에서 draw_weight 비례로 카드 선택.
 */
export const DRAW_GRADE_RATES: Record<DrawType, Record<CardGrade, number>> = {
  normal: { normal: 60, rare: 27, epic: 10, legend: 2.7, mythic: 0.3 },
  premium: { normal: 40, rare: 33, epic: 20, legend: 6, mythic: 1 },
} as const

/** 프리미엄 10연차 보장: 최소 1장 에픽 이상 (초안) */
export const PREMIUM_TEN_GUARANTEE_GRADE: CardGrade = 'epic'

/** 확률 테이블 합계 검증 — 테스트/기동 시 정합성 확인용 */
export const gradeRateTotal = (type: DrawType): number =>
  CARD_GRADES.reduce((sum, grade) => sum + DRAW_GRADE_RATES[type][grade], 0)

export const isDrawType = (value: unknown): value is DrawType =>
  typeof value === 'string' && (DRAW_TYPES as readonly string[]).includes(value)
