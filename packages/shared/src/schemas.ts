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
  /**
   * 이미지 참조. null 허용 — 이미지 없이 먼저 등록하고 나중에 업로드하는 흐름을 지원한다.
   * 형식(Storage 공개 URL vs 버킷 경로)은 4단계 Storage 연결 시 확정하므로 여기서 제약하지 않는다.
   */
  imageUrl: z.string().trim().min(1, '이미지 경로가 비어 있습니다').nullable().default(null),
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

/**
 * 운영자 수동 정산 — 크롤링 실패 시 결과를 직접 입력한다.
 * KBO는 무승부가 존재하므로 동점을 허용한다(연장 후 무승부).
 */
export const gameSettleSchema = z.object({
  gameId: z.string().min(1),
  homeScore: z.number().int().min(0).max(99),
  awayScore: z.number().int().min(0).max(99),
})

export type GameSettle = z.infer<typeof gameSettleSchema>

/** 팀 컬러 — #RRGGBB 6자리 hex만 허용(축약형 #RGB 금지: 화면마다 해석이 갈림) */
export const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, '색상은 #RRGGBB 형식이어야 합니다')

/**
 * 구단 수정 — 어드민 구단 관리.
 * KBO 10개 구단은 고정이라 생성/삭제는 없고 수정만 한다.
 */
export const teamUpdateSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1, '팀명을 입력하세요').max(30),
  shortName: z.string().trim().min(1, '약칭을 입력하세요').max(6),
  color: hexColorSchema,
  /** 로고 참조. null 허용 — 미등록 시 팀 컬러로 대체 표시한다 */
  logoUrl: z.string().trim().min(1, '로고 경로가 비어 있습니다').nullable().default(null),
})

export type TeamUpdate = z.infer<typeof teamUpdateSchema>

/**
 * 로그인 입력. 앱/어드민 공통(둘 다 Supabase Auth 이메일 로그인을 쓴다).
 * 실제 인증은 서버에서 하고, 이 스키마는 입력 형식만 걸러 불필요한 요청을 줄인다.
 */
export const credentialsSchema = z.object({
  email: z.string().trim().min(1, '이메일을 입력하세요').email('이메일 형식이 올바르지 않습니다'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
})

export type Credentials = z.infer<typeof credentialsSchema>

/**
 * 닉네임 규칙 — 앱 온보딩과 설정(수정)에서 공용.
 * DB 에도 같은 제약이 걸려 있다(users_nickname_length / users_nickname_format).
 * 규칙을 바꾸면 스키마 마이그레이션도 함께 고쳐야 한다.
 */
export const NICKNAME_MIN_LENGTH = 2
export const NICKNAME_MAX_LENGTH = 12

/** 한글 완성형·영문·숫자만. 단독 자모(ㄱ, ㅏ)와 공백·특수문자는 제외한다 */
export const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9]+$/

export const nicknameSchema = z
  .string()
  .trim()
  .min(NICKNAME_MIN_LENGTH, `닉네임은 ${String(NICKNAME_MIN_LENGTH)}자 이상이어야 합니다`)
  .max(NICKNAME_MAX_LENGTH, `닉네임은 ${String(NICKNAME_MAX_LENGTH)}자 이하여야 합니다`)
  .regex(NICKNAME_PATTERN, '한글·영문·숫자만 사용할 수 있습니다')

/**
 * 프로필 입력 — 온보딩과 설정에서 같은 스키마를 쓴다.
 * 응원팀은 nullable(미선택 상태가 존재). 온보딩 화면에서는 UI 가 선택을 요구한다.
 */
export const profileUpdateSchema = z.object({
  nickname: nicknameSchema,
  favoriteTeamId: z.number().int().positive().nullable().default(null),
})

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>
