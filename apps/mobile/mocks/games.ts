import type { YesterdaySummary } from '@/components/game/YesterdayBanner'
import type { GameView } from '@/types/game'

/**
 * 홈 화면 목업.
 *
 * ⚠️ **6-4 에서 TanStack Query 훅으로 교체한 뒤 이 파일을 지운다.** 어드민에서 fixture 를
 * 실 DB 연결 후에도 남겨뒀다가 대시보드에 날짜가 하드코딩된 채로 방치된 일이 있었다.
 *
 * **홈은 당일 경기만 보여준다.** 그래도 모든 단계를 한 화면에서 볼 수 있다 —
 * 일요일 14:00 경기는 17시경 정산이 끝나므로 당일에도 settled·cancelled 가 나온다.
 * 그래서 낮경기(-300분)로 그 상태들을 만들어 뒀다.
 *
 * 지난 날짜 예측은 **예측 탭**이 보여준다(홈에 섞지 않는다).
 *
 * 시각은 **실행 시점 기준 상대값**으로 만든다. 고정 문자열로 두면 하루만 지나도
 * 전부 "마감"으로 보여서 화면을 확인할 수 없다.
 */

/** 구단 컬러는 `teams` seed 값과 같다 */
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
} as const satisfies Record<string, GameView['home']>

const minutesFromNow = (minutes: number): string =>
  new Date(Date.now() + minutes * 60 * 1000).toISOString()

/** 마감은 시작 1시간 전 */
const closeFor = (startMinutes: number): string => minutesFromNow(startMinutes - 60)

export const mockGames = (): readonly GameView[] => [
  {
    // 예측 가능 — 여유 있음
    id: 'g1',
    startAt: minutesFromNow(300),
    predictCloseAt: closeFor(300),
    status: 'scheduled',
    cancelled: false,
    home: TEAMS.LG,
    away: TEAMS.두산,
    homeScore: null,
    awayScore: null,
    myPrediction: null,
  },
  {
    // 예측 가능 + 이미 예측함
    id: 'g2',
    startAt: minutesFromNow(300),
    predictCloseAt: closeFor(300),
    status: 'scheduled',
    cancelled: false,
    home: TEAMS.KT,
    away: TEAMS.한화,
    homeScore: null,
    awayScore: null,
    myPrediction: {
      pickWinner: 'home',
      pickHomeScore: 5,
      pickAwayScore: 3,
      result: 'pending',
      earnedPoints: null,
    },
  },
  {
    // 마감 임박 — 시간 강조
    id: 'g3',
    startAt: minutesFromNow(75),
    predictCloseAt: closeFor(75),
    status: 'scheduled',
    cancelled: false,
    home: TEAMS.삼성,
    away: TEAMS.롯데,
    homeScore: null,
    awayScore: null,
    myPrediction: null,
  },
  {
    // 경기 중
    id: 'g4',
    startAt: minutesFromNow(-90),
    predictCloseAt: closeFor(-90),
    status: 'live',
    cancelled: false,
    home: TEAMS.KIA,
    away: TEAMS.NC,
    homeScore: null,
    awayScore: null,
    myPrediction: {
      pickWinner: 'away',
      pickHomeScore: null,
      pickAwayScore: null,
      result: 'pending',
      earnedPoints: null,
    },
  },
  {
    // 집계 중 — 종료됐지만 정산 전. 스코어를 보여주지 않는다
    id: 'g5',
    startAt: minutesFromNow(-240),
    predictCloseAt: closeFor(-240),
    status: 'aggregating',
    cancelled: false,
    home: TEAMS.SSG,
    away: TEAMS.키움,
    homeScore: null,
    awayScore: null,
    myPrediction: {
      pickWinner: 'home',
      pickHomeScore: null,
      pickAwayScore: null,
      result: 'pending',
      earnedPoints: null,
    },
  },
  {
    // 정산 완료 — 스코어 적중 (오늘 낮경기)
    id: 'g6',
    startAt: minutesFromNow(-300),
    predictCloseAt: closeFor(-300),
    status: 'settled',
    cancelled: false,
    home: TEAMS.두산,
    away: TEAMS.LG,
    homeScore: 5,
    awayScore: 1,
    myPrediction: {
      pickWinner: 'home',
      pickHomeScore: 5,
      pickAwayScore: 1,
      result: 'score_hit',
      earnedPoints: 150,
    },
  },
  {
    // 정산 완료 — 미적중 (오늘 낮경기)
    id: 'g7',
    startAt: minutesFromNow(-300),
    predictCloseAt: closeFor(-300),
    status: 'settled',
    cancelled: false,
    home: TEAMS.한화,
    away: TEAMS.KT,
    homeScore: 2,
    awayScore: 7,
    myPrediction: {
      pickWinner: 'home',
      pickHomeScore: null,
      pickAwayScore: null,
      result: 'miss',
      earnedPoints: 0,
    },
  },
  {
    // 무승부 정산 — 무승부를 골라 적중 (KBO 는 무승부가 실제로 있다: 실측 3:3, 0:0)
    id: 'g9',
    startAt: minutesFromNow(-300),
    predictCloseAt: closeFor(-300),
    status: 'settled',
    cancelled: false,
    home: TEAMS.롯데,
    away: TEAMS.키움,
    homeScore: 3,
    awayScore: 3,
    myPrediction: {
      pickWinner: 'draw',
      pickHomeScore: null,
      pickAwayScore: null,
      result: 'win_hit',
      earnedPoints: 30,
    },
  },
  {
    // 우천 취소 — 예측은 무효 (오늘 낮경기)
    id: 'g8',
    startAt: minutesFromNow(-300),
    predictCloseAt: closeFor(-300),
    status: 'settled',
    cancelled: true,
    home: TEAMS.NC,
    away: TEAMS.삼성,
    homeScore: null,
    awayScore: null,
    myPrediction: {
      pickWinner: 'away',
      pickHomeScore: null,
      pickAwayScore: null,
      result: 'void',
      earnedPoints: 0,
    },
  },
]

/**
 * 어제 결과 요약 목업.
 *
 * 어제 예측이 없으면 `null` — 배너를 렌더하지 않는다.
 */
export const mockYesterdaySummary = (): YesterdaySummary | null => ({
  predicted: 3,
  hits: 2,
  earnedPoints: 60,
})
