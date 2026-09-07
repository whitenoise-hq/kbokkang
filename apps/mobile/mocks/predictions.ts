import {
  bestStreak,
  currentStreak,
  groupPredictionsByDay,
  isHit,
  isResolved,
} from '@kbokkang/shared'
import { kstDateOf } from '@/lib/format'
import type { PredictionDayView, PredictionRecordView } from '@/types/prediction'

/**
 * 예측 탭 목업.
 *
 * ⚠️ **6-4 에서 TanStack Query 훅으로 교체한 뒤 이 파일을 지운다.**
 *
 * **성적은 목록에서 계산한다** — 하드코딩하면 목록과 요약이 어긋난 화면을 보게 되고,
 * 그러면 계산이 틀렸는지 목업이 틀렸는지 알 수 없다. shared 의 `bestStreak` 등을
 * 그대로 쓰므로 실데이터로 바꿔도 같은 숫자가 나온다.
 *
 * 날짜는 **실행 시점 기준 상대값**이다. 고정 문자열로 두면 "어제"가 계속 밀린다.
 */

const TEAMS = {
  LG: { shortName: 'LG', color: '#C30452' },
  두산: { shortName: '두산', color: '#131230' },
  KT: { shortName: 'KT', color: '#000000' },
  한화: { shortName: '한화', color: '#FF6600' },
  삼성: { shortName: '삼성', color: '#074CA1' },
  롯데: { shortName: '롯데', color: '#041E42' },
  KIA: { shortName: 'KIA', color: '#EA0029' },
  NC: { shortName: 'NC', color: '#315288' },
  SSG: { shortName: 'SSG', color: '#CE0E2D' },
  키움: { shortName: '키움', color: '#570514' },
} as const

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * 며칠 전 `hh:30`(KST).
 *
 * 날짜는 **KST 기준**으로 만든다(`kstDateOf`). 기기 로컬 날짜로 조립하면 시뮬레이터
 * 타임존이 KST 가 아닐 때 그룹 날짜와 `formatDayLabel` 의 "어제" 판정이 어긋난다.
 */
const daysAgoAt = (days: number, hour: number): string =>
  `${kstDateOf(new Date(Date.now() - days * DAY_MS))}T${String(hour).padStart(2, '0')}:30:00+09:00`

/** 목록은 **최신 날짜가 먼저**다. 하루 안에서는 경기 시각 순이다. */
export const mockPredictionDays = (): readonly PredictionDayView[] => [
  {
    date: daysAgoAt(1, 18).slice(0, 10),
    rows: [
      {
        id: 'p1',
        startAt: daysAgoAt(1, 18),
        home: TEAMS.LG,
        away: TEAMS.두산,
        homeScore: 5,
        awayScore: 1,
        cancelled: false,
        pickWinner: 'home',
        result: 'win_hit',
        earnedPoints: 30,
      },
      {
        id: 'p2',
        startAt: daysAgoAt(1, 18),
        home: TEAMS.한화,
        away: TEAMS.KT,
        homeScore: 2,
        awayScore: 7,
        cancelled: false,
        pickWinner: 'home',
        result: 'miss',
        earnedPoints: 0,
      },
      {
        // 우천 취소 — 무효. 적중률·연승에서 빠진다
        id: 'p3',
        startAt: daysAgoAt(1, 18),
        home: TEAMS.NC,
        away: TEAMS.삼성,
        homeScore: null,
        awayScore: null,
        cancelled: true,
        pickWinner: 'away',
        result: 'void',
        earnedPoints: 0,
      },
    ],
  },
  {
    date: daysAgoAt(2, 17).slice(0, 10),
    rows: [
      {
        // 무승부 적중 — KBO 는 무승부가 실제로 있다(실측 3:3)
        id: 'p4',
        startAt: daysAgoAt(2, 17),
        home: TEAMS.롯데,
        away: TEAMS.키움,
        homeScore: 3,
        awayScore: 3,
        cancelled: false,
        pickWinner: 'draw',
        result: 'win_hit',
        earnedPoints: 30,
      },
      {
        id: 'p5',
        startAt: daysAgoAt(2, 17),
        home: TEAMS.SSG,
        away: TEAMS.KIA,
        homeScore: 8,
        awayScore: 4,
        cancelled: false,
        pickWinner: 'home',
        result: 'win_hit',
        earnedPoints: 30,
      },
    ],
  },
  {
    date: daysAgoAt(3, 18).slice(0, 10),
    rows: [
      {
        id: 'p6',
        startAt: daysAgoAt(3, 18),
        home: TEAMS.두산,
        away: TEAMS.LG,
        homeScore: 0,
        awayScore: 3,
        cancelled: false,
        pickWinner: 'home',
        result: 'miss',
        earnedPoints: 0,
      },
    ],
  },
]

export const mockPredictionRecord = (
  days: readonly PredictionDayView[],
): PredictionRecordView => {
  const rows = days.flatMap((day) => day.rows)
  const results = rows.map((row) => row.result)
  // 연승은 하루 단위다 — 날짜별로 묶어서 넘긴다(`bestStreak` 주석)
  const grouped = groupPredictionsByDay(rows)

  return {
    totalPredictions: rows.length,
    resolvedPredictions: results.filter(isResolved).length,
    hits: results.filter(isHit).length,
    currentStreak: currentStreak(grouped),
    bestStreak: bestStreak(grouped),
    earnedPoints: rows.reduce((sum, row) => sum + (row.earnedPoints ?? 0), 0),
  }
}
