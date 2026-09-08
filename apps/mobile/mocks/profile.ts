import type { PointEntryView, ProfileView, TeamView } from '@/types/profile'

/**
 * 마이 화면 목업.
 *
 * ⚠️ **6-4/6-5 에서 `users` 조회와 `teams` 조회로 교체한 뒤 이 파일을 지운다.**
 *
 * 구단 목록은 `supabase/migrations/20260831000001_seed_teams.sql` 의 **순서와 값을 그대로**
 * 옮겼다(id 는 seed 삽입 순서). 색이 어긋나면 응원팀 표시가 실제와 달라진다.
 */

export const MOCK_TEAMS: readonly TeamView[] = [
  { id: 1, name: 'KIA 타이거즈', shortName: 'KIA', color: '#EA0029' },
  { id: 2, name: '삼성 라이온즈', shortName: '삼성', color: '#074CA1' },
  { id: 3, name: 'LG 트윈스', shortName: 'LG', color: '#C30452' },
  { id: 4, name: '두산 베어스', shortName: '두산', color: '#131230' },
  { id: 5, name: 'KT 위즈', shortName: 'KT', color: '#000000' },
  { id: 6, name: 'SSG 랜더스', shortName: 'SSG', color: '#CE0E2D' },
  { id: 7, name: '롯데 자이언츠', shortName: '롯데', color: '#041E42' },
  { id: 8, name: '한화 이글스', shortName: '한화', color: '#FF6600' },
  { id: 9, name: 'NC 다이노스', shortName: 'NC', color: '#315288' },
  { id: 10, name: '키움 히어로즈', shortName: '키움', color: '#570514' },
]

/** 이미 쓰이는 닉네임 — 중복 확인 화면을 목업으로 확인하기 위한 값 */
export const MOCK_TAKEN_NICKNAMES: readonly string[] = ['두산곰', '야구왕', 'kbo']

export const mockProfile = (): ProfileView => ({
  nickname: '곰돌이팬',
  favoriteTeam: MOCK_TEAMS[3] ?? null,
  points: 1240,
})

/** 며칠 전 시각(KST) */
const daysAgo = (days: number, hour: number): string => {
  const base = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  base.setUTCHours(hour - 9, 30, 0, 0)
  return base.toISOString()
}

/**
 * 포인트 내역 — **최신이 먼저**다.
 *
 * 획득·사용이 섞여 있어야 부호와 색을 확인할 수 있다. `duplicate_refund` 는 쓰지 않는다 —
 * 중복 자동 환급을 폐지했다(통합기획서 6장). 중복은 도감에서 팔아 `sell` 로 기록된다.
 */
export const mockPointHistory = (): readonly PointEntryView[] => [
  { id: 'p1', reason: 'predict_win', amount: 30, createdAt: daysAgo(0, 22) },
  { id: 'p2', reason: 'draw', amount: -100, createdAt: daysAgo(0, 21) },
  { id: 'p3', reason: 'sell', amount: 10, createdAt: daysAgo(0, 21) },
  { id: 'p4', reason: 'predict_win', amount: 30, createdAt: daysAgo(1, 22) },
  { id: 'p5', reason: 'draw', amount: -950, createdAt: daysAgo(1, 20) },
  { id: 'p6', reason: 'predict_win', amount: 30, createdAt: daysAgo(2, 22) },
  { id: 'p7', reason: 'signup', amount: 200, createdAt: daysAgo(9, 14) },
]
