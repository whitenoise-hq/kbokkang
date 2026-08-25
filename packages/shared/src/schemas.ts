/**
 * 공통 입력 검증 스키마(zod). 어드민 폼·서버 액션·앱 요청에서 공용으로 사용한다.
 */

import { z } from 'zod'
import { CARD_GRADES } from './grades'
import { CARD_TYPES } from './card-types'
import { DEX_NO_PATTERN } from './dex'
import { DRAW_TYPES, TEN_DRAW_COUNT } from './draw'
import { PREDICTION_PICKS } from './game'

export const cardGradeSchema = z.enum(CARD_GRADES)
export const cardTypeSchema = z.enum(CARD_TYPES)
export const dexNoSchema = z.string().regex(DEX_NO_PATTERN, '도감번호 형식이 올바르지 않습니다')
export const drawTypeSchema = z.enum(DRAW_TYPES)

/** 카드 등록/수정 입력 — dex_no는 서버에서 자동 부여하므로 입력에 없다. */
export const cardInputSchema = z.object({
  name: z.string().trim().min(1, '카드 이름을 입력하세요').max(40),
  grade: cardGradeSchema,
  type: cardTypeSchema,
  imageUrl: z.string().url('이미지 URL이 올바르지 않습니다'),
  drawWeight: z.number().int().min(1).max(1000).default(1),
  isSeason: z.boolean().default(false),
})

export type CardInput = z.infer<typeof cardInputSchema>

/** 뽑기 요청 — 1장 또는 10연차만 허용 */
export const drawRequestSchema = z.object({
  drawType: drawTypeSchema,
  count: z.union([z.literal(1), z.literal(TEN_DRAW_COUNT)]),
})

export type DrawRequest = z.infer<typeof drawRequestSchema>

/** 예측 입력 — 스코어는 선택, 둘 중 하나만 넣는 것은 불가 */
export const predictionInputSchema = z
  .object({
    gameId: z.string().uuid(),
    pickWinner: z.enum(PREDICTION_PICKS),
    pickHomeScore: z.number().int().min(0).max(99).nullable().default(null),
    pickAwayScore: z.number().int().min(0).max(99).nullable().default(null),
  })
  .refine(
    ({ pickHomeScore, pickAwayScore }) => (pickHomeScore === null) === (pickAwayScore === null),
    { message: '스코어 예측은 홈/원정 둘 다 입력해야 합니다', path: ['pickHomeScore'] },
  )

export type PredictionInput = z.infer<typeof predictionInputSchema>

/** 운영자 포인트 수동 조정 */
export const pointAdjustSchema = z.object({
  userId: z.string().uuid(),
  amount: z
    .number()
    .int()
    .refine((value) => value !== 0, '0은 조정할 수 없습니다'),
  memo: z.string().trim().min(1, '조정 사유를 입력하세요').max(200),
})

export type PointAdjust = z.infer<typeof pointAdjustSchema>
