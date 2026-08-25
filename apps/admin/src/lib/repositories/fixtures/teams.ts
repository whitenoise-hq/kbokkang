import type { Team } from '@kbokkang/shared'

/**
 * 구단 fixture. 4단계에서 Supabase seed 데이터로 그대로 옮긴다.
 * 로고는 아직 없음(어드민 구단 관리 화면에서 업로드 예정).
 */
export const TEAM_FIXTURES: readonly Team[] = [
  { id: 1, name: 'KIA 타이거즈', shortName: 'KIA', logoUrl: null, color: '#EA0029' },
  { id: 2, name: '삼성 라이온즈', shortName: '삼성', logoUrl: null, color: '#074CA1' },
  { id: 3, name: 'LG 트윈스', shortName: 'LG', logoUrl: null, color: '#C30452' },
  { id: 4, name: '두산 베어스', shortName: '두산', logoUrl: null, color: '#131230' },
  { id: 5, name: 'KT 위즈', shortName: 'KT', logoUrl: null, color: '#000000' },
  { id: 6, name: 'SSG 랜더스', shortName: 'SSG', logoUrl: null, color: '#CE0E2D' },
  { id: 7, name: '롯데 자이언츠', shortName: '롯데', logoUrl: null, color: '#041E42' },
  { id: 8, name: '한화 이글스', shortName: '한화', logoUrl: null, color: '#FF6600' },
  { id: 9, name: 'NC 다이노스', shortName: 'NC', logoUrl: null, color: '#315288' },
  { id: 10, name: '키움 히어로즈', shortName: '키움', logoUrl: null, color: '#570514' },
]

export const teamById = (id: number | null): Team | null =>
  id === null ? null : (TEAM_FIXTURES.find((team) => team.id === id) ?? null)
