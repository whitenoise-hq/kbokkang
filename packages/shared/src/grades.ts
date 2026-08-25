/**
 * 카드 등급 정의 — 앱/어드민 공통 단일 출처.
 * 통합기획서 4.1 기준. 여기 외의 곳에서 등급/색/접두어를 재정의하지 말 것.
 */

export const CARD_GRADES = ['normal', 'rare', 'epic', 'legend', 'mythic'] as const

export type CardGrade = (typeof CARD_GRADES)[number]

/** 등급 레이아웃: 박스형(캐릭터가 프레임 안) / 풀아트(카드 전체) */
export type CardLayout = 'boxed' | 'full_art'

export interface CardGradeMeta {
  /** 도감번호 접두어 */
  readonly prefix: string
  /** 한국어 표기 */
  readonly label: string
  /** 등급 대표 색 (hex) — 04_앱디자인가이드.md 1장 등급색 기준 */
  readonly color: string
  readonly layout: CardLayout
  /** 반짝임 모션 여부 — 레전드/신화만 true (앱에서 코드 오버레이) */
  readonly hasShimmer: boolean
}

export const CARD_GRADE_META: Record<CardGrade, CardGradeMeta> = {
  normal: { prefix: 'N', label: '일반', color: '#8B95A1', layout: 'boxed', hasShimmer: false },
  rare: { prefix: 'R', label: '레어', color: '#4A90D9', layout: 'boxed', hasShimmer: false },
  epic: { prefix: 'E', label: '에픽', color: '#9B51E0', layout: 'boxed', hasShimmer: false },
  legend: { prefix: 'L', label: '레전드', color: '#F2A900', layout: 'full_art', hasShimmer: true },
  mythic: { prefix: 'M', label: '신화', color: '#E03131', layout: 'full_art', hasShimmer: true },
} as const

/** 접두어 → 등급 역방향 조회 (도감번호 파싱용) */
export const CARD_GRADE_BY_PREFIX: Readonly<Record<string, CardGrade>> = Object.freeze(
  Object.fromEntries(
    CARD_GRADES.map((grade) => [CARD_GRADE_META[grade].prefix, grade] as const),
  ) as Record<string, CardGrade>,
)

/** 낮은 등급 → 높은 등급 순서 인덱스. 등급 비교(보장 규칙 등)에 사용. */
export const gradeRank = (grade: CardGrade): number => CARD_GRADES.indexOf(grade)

export const isCardGrade = (value: unknown): value is CardGrade =>
  typeof value === 'string' && (CARD_GRADES as readonly string[]).includes(value)
