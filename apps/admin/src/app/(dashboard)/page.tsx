import Link from 'next/link'
import { CalendarCheck, Layers, Sparkles, Users } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { repositories, DEFAULT_PAGE_SIZE } from '@/lib/repositories'
import { formatNumber, formatPoints, formatPercent, toPercent } from '@/lib/format'
import { GradeDistribution } from './_components/grade-distribution'
import { TodayGames } from './_components/today-games'

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

  const pointTotal = summary.pointsIssuedToday + summary.pointsSpentToday
  const netPoints = summary.pointsIssuedToday - summary.pointsSpentToday

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
        <GradeDistribution cardsByGrade={summary.cardsByGrade} totalCards={summary.totalCards} />
        <TodayGames games={todayGames.items} teams={teams} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">오늘 포인트 흐름</CardTitle>
          <p className="text-muted-foreground text-xs">
            순증감{' '}
            <span className={netPoints >= 0 ? 'text-success' : 'text-destructive'}>
              {netPoints >= 0 ? '+' : '\u2212'}
              {formatNumber(Math.abs(netPoints))}p
            </span>
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 유입 대비 소비 비중을 한 줄 막대로 */}
          <div className="bg-muted flex h-2.5 gap-0.5 overflow-hidden rounded-full">
            <div
              className="bg-success h-full rounded-l-full"
              style={{ width: `${toPercent(summary.pointsIssuedToday, pointTotal)}%` }}
            />
            <div
              className="bg-destructive h-full rounded-r-full"
              style={{ width: `${toPercent(summary.pointsSpentToday, pointTotal)}%` }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-2.5">
              <span className="bg-success size-2.5 shrink-0 rounded-full" aria-hidden />
              <span className="text-muted-foreground text-sm">유입</span>
              <span className="tabular ml-auto text-lg font-bold">
                {formatNumber(summary.pointsIssuedToday)}
              </span>
              <span className="text-muted-foreground tabular w-9 text-right text-[11px]">
                {formatPercent(toPercent(summary.pointsIssuedToday, pointTotal), 0)}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="bg-destructive size-2.5 shrink-0 rounded-full" aria-hidden />
              <span className="text-muted-foreground text-sm">소비</span>
              <span className="tabular ml-auto text-lg font-bold">
                {formatNumber(summary.pointsSpentToday)}
              </span>
              <span className="text-muted-foreground tabular w-9 text-right text-[11px]">
                {formatPercent(toPercent(summary.pointsSpentToday, pointTotal), 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default DashboardPage
