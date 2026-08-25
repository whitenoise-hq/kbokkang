/**
 * 디자인 토큰 — `docs/04_앱디자인가이드.md` (토스 스타일) 단일 출처.
 *
 * 규칙: 화면마다 색/폰트/여백을 즉흥적으로 정하지 말고 반드시 이 토큰을 참조한다.
 * 등급색은 카드·등급 표시 전용 (일반 UI에는 COLORS.primary만 사용).
 */

import { CARD_GRADE_META, type CardGrade } from './grades'

export const COLORS = {
  /** 메인 파랑. 주요 버튼·강조·활성 상태 */
  primary: '#3182F6',
  /** 버튼 눌림 */
  primaryPressed: '#1B64DA',
  /** 파랑 배경(선택 영역 등) */
  primaryLight: '#E8F1FD',

  background: '#FFFFFF',
  surface: '#F9FAFB',
  border: '#E5E8EB',

  textStrong: '#191F28',
  textNormal: '#4E5968',
  textAlt: '#8B95A1',
  textDisabled: '#C9CDD2',

  /** 적중·성공 */
  success: '#00B26E',
  /** 실패·경고·포인트 차감 */
  danger: '#F04452',
  /** 집계중 등 대기 상태 */
  warning: '#FFB020',
} as const

export type ColorToken = keyof typeof COLORS

/** 등급색은 grades.ts의 CARD_GRADE_META를 그대로 재노출한다(중복 정의 방지). */
export const gradeColor = (grade: CardGrade): string => CARD_GRADE_META[grade].color

export type FontWeightToken = 'regular' | 'semibold' | 'bold'

export interface TypeStyle {
  readonly fontSize: number
  readonly weight: FontWeightToken
}

export const TYPOGRAPHY = {
  /** 포인트 잔액, 큰 숫자 강조 */
  display: { fontSize: 32, weight: 'bold' },
  /** 화면 제목 */
  title1: { fontSize: 24, weight: 'bold' },
  /** 섹션 제목 */
  title2: { fontSize: 20, weight: 'bold' },
  body1: { fontSize: 16, weight: 'regular' },
  body2: { fontSize: 14, weight: 'regular' },
  caption: { fontSize: 12, weight: 'regular' },
  button: { fontSize: 16, weight: 'semibold' },
} as const satisfies Record<string, TypeStyle>

export type TypographyToken = keyof typeof TYPOGRAPHY

/** 여백 — 4px 단위 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
} as const

export type SpacingToken = keyof typeof SPACING

/** 화면 좌우 기본 패딩 (md 이상) */
export const SCREEN_PADDING = SPACING.md

/** 섹션 간 기본 간격 (lg 이상) */
export const SECTION_GAP = SPACING.lg

export const RADIUS = {
  /** 작은 요소 */
  sm: 8,
  /** 버튼, 인풋 */
  md: 12,
  /** 카드, 모달 */
  lg: 16,
  /** 원형, 알약 버튼 */
  full: 999,
} as const

export type RadiusToken = keyof typeof RADIUS

/** 그림자 — 은은하게. 진한 그림자 금지. */
export const SHADOW = {
  card: { offsetY: 2, blur: 8, color: 'rgba(0, 0, 0, 0.06)' },
  floating: { offsetY: 4, blur: 16, color: 'rgba(0, 0, 0, 0.10)' },
} as const

export type ShadowToken = keyof typeof SHADOW

/** 메인 버튼 높이 (넉넉하게) */
export const BUTTON_HEIGHT = 52

/** 버튼 탭 피드백 scale */
export const PRESS_SCALE = 0.98

/** 애니메이션 지속 시간(ms) — 과하지 않게 빠르고 자연스럽게 */
export const DURATION = {
  fast: 200,
  normal: 300,
} as const

export type DurationToken = keyof typeof DURATION
