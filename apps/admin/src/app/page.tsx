import Link from 'next/link'
import { CalendarCheck, Layers, Sparkles, Users } from 'lucide-react'
import { CARD_GRADE_META, GAME_STATUS_LABEL } from '@kbokkang/shared'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { GradeBadge } from '@/components/grade-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { repositories, DEFAULT_PAGE_SIZE } from '@/lib/repositories'
import { formatNumber, formatPoints, formatTime, toPercent } from '@/lib/format'

/** 대시보드 — 어드민 기획서 3.2 */
const DashboardPage = async () => {
  const [summary, todayGames, teams] = await Promise.all([
    repositories.stats.dashboard(),
    repositories.games.list(
      { date: '2026-08-25', status: null },
      { page: 1, pageSize: DEFAULT_PAGE_SIZE },
    ),
    repositories.teams.list(),
  ])

  const teamName = (id: number) => teams.find((team) => team.id === id)?.shortName ?? '-'
  const maxGradeCount = Math.max(...summary.cardsByGrade.map((item) => item.count), 1)

  return (
    <>
      <PageHeader
        title="대시보드"
        description="오늘의 운영 현황 요약"
        action={
          <Button asChild>
            <Link href="/cards/new">카드 등록</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="총 유저"
          value={formatNumber(summary.totalUsers)}
          unit="명"
          hint={`오늘 활동 ${formatNumber(summary.activeUsersToday)}명`}
          icon={Users}
        />
        <StatCard
          label="등록 카드"
          value={formatNumber(summary.totalCards)}
          unit="장"
          hint="목표 150장"
          icon={Layers}
        />
        <StatCard
          label="오늘 뽑기"
          value={formatNumber(summary.drawsToday)}
          unit="회"
          hint={`소비 ${formatPoints(summary.pointsSpentToday)}`}
          icon={Sparkles}
        />
        <StatCard
          label="오늘 경기"
          value={`${formatNumber(summary.gamesSettledToday)} / ${formatNumber(summary.gamesToday)}`}
          hint="정산 완료 / 전체"
          icon={CalendarCheck}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">등급별 카드 수</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {summary.cardsByGrade.map(({ grade, count }) => (
              <div key={grade} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <GradeBadge grade={grade} />
                  <span className="tabular text-sm font-semibold">{formatNumber(count)}장</span>
                </div>
                <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${toPercent(count, maxGradeCount)}%`,
                      backgroundColor: CARD_GRADE_META[grade].color,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">오늘 경기</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/games">전체 보기</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayGames.items.map((game) => (
              <div
                key={game.id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="tabular text-muted-foreground w-11 text-xs">
                    {formatTime(game.startAt)}
                  </span>
                  <span className="text-sm font-medium">
                    {teamName(game.awayTeamId)} @ {teamName(game.homeTeamId)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {game.homeScore !== null && game.awayScore !== null && (
                    <span className="tabular text-sm font-semibold">
                      {game.awayScore} : {game.homeScore}
                    </span>
                  )}
                  <span className="text-muted-foreground text-xs">
                    {GAME_STATUS_LABEL[game.status]}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">오늘 포인트 흐름</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground text-sm">유입</span>
              <span className="tabular text-success text-xl font-bold">
                +{formatNumber(summary.pointsIssuedToday)}
              </span>
            </div>
            <Progress
              value={toPercent(
                summary.pointsIssuedToday,
                summary.pointsIssuedToday + summary.pointsSpentToday,
              )}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground text-sm">소비</span>
              <span className="tabular text-destructive text-xl font-bold">
                −{formatNumber(summary.pointsSpentToday)}
              </span>
            </div>
            <Progress
              value={toPercent(
                summary.pointsSpentToday,
                summary.pointsIssuedToday + summary.pointsSpentToday,
              )}
            />
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default DashboardPage
