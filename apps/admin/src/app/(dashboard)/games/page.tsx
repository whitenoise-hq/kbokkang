import { GAME_STATUSES, type GameStatus } from '@kbokkang/shared'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { repositories } from '@/lib/repositories'
import { formatDateWithWeekday, todayInKst } from '@/lib/format'
import { DateNavigator } from './_components/date-navigator'
import { GameTable } from './_components/game-table'
import { CrawlStatus } from './_components/crawl-status'

/** 하루 최대 5경기라 페이지네이션 없이 한 번에 받는다 */
const ONE_DAY_LIMIT = 20

interface SearchParams {
  date?: string
  status?: string
}

const isGameStatus = (value: string): value is GameStatus =>
  (GAME_STATUSES as readonly string[]).includes(value)

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** 경기 / 예측 관리 — 어드민 기획서 3.5. 항상 하루 단위, 기본값은 오늘. */
const GamesPage = async ({ searchParams }: { searchParams: Promise<SearchParams> }) => {
  const params = await searchParams
  const today = todayInKst()
  const date = params.date !== undefined && ISO_DATE.test(params.date) ? params.date : today
  const status = params.status !== undefined && isGameStatus(params.status) ? params.status : null

  const [dayGames, teams, crawlRun] = await Promise.all([
    // 크롤링 상태는 상태 필터와 무관하게 그날 전체를 봐야 하므로 status 없이 받는다
    repositories.games.list({ date, status: null }, { page: 1, pageSize: ONE_DAY_LIMIT }),
    repositories.teams.list(),
    repositories.games.latestRun(date),
  ])

  const visibleGames =
    status === null ? dayGames.items : dayGames.items.filter((game) => game.status === status)

  return (
    <>
      <PageHeader
        title="경기 관리"
        description={`${formatDateWithWeekday(date)}${date === today ? ' · 오늘' : ''}`}
      />

      <CrawlStatus date={date} games={dayGames.items} run={crawlRun} />

      <DateNavigator date={date} today={today} />

      <Card className="overflow-hidden py-0">
        <CardContent className="px-0">
          <GameTable games={visibleGames} teams={teams} />
        </CardContent>
      </Card>
    </>
  )
}

export default GamesPage
