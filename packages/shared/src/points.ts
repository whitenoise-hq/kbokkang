/**
 * 포인트 경제 — 통합기획서 6장 확정값(시작값, 데이터 기반 튜닝 대상).
 * 앱/어드민 어디서도 이 값을 재정의하지 말 것.
 */

import type { CardGrade } from './grades'

/** 포인트 유입 */
export const POINT_REWARD = {
  /** 회원가입 보너스 */
  signup: 200,
  /** 승패 적중 (경기당) */
  predictWin: 30,
  /** 스코어 적중 (경기당, 승패 포함) */
  predictScore: 150,
} as const

/**
 * 등급별 판매가 = 중복 환급가 (동일 값으로 통일).
 * cards 테이블에 저장하지 않고 항상 이 상수로 계산한다.
 */
export const CARD_SELL_PRICE: Record<CardGrade, number> = {
  normal: 5,
  rare: 10,
  epic: 15,
  legend: 20,
  mythic: 30,
} as const

export const sellPriceOf = (grade: CardGrade): number => CARD_SELL_PRICE[grade]

/** 중복 획득 시 환급 포인트 (판매가와 동일) */
export const duplicateRefundOf = (grade: CardGrade): number => CARD_SELL_PRICE[grade]

/** 도감의 마지막 1장은 판매 불가 — 여분만 판매 가능 */
export const MIN_KEEP_COUNT = 1

export const sellableCount = (ownedCount: number): number =>
  Math.max(0, ownedCount - MIN_KEEP_COUNT)

/** 포인트 변동 사유 — point_transactions.reason */
export const POINT_REASONS = [
  'signup',
  'predict_win',
  'predict_score',
  'draw',
  'duplicate_refund',
  'sell',
  'admin_adjust',
] as const

export type PointReason = (typeof POINT_REASONS)[number]

export const POINT_REASON_LABEL: Record<PointReason, string> = {
  signup: '가입 보너스',
  predict_win: '승패 적중',
  predict_score: '스코어 적중',
  draw: '카드 뽑기',
  duplicate_refund: '중복 환급',
  sell: '카드 판매',
  admin_adjust: '운영자 조정',
} as const
