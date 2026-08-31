import { TriangleAlert } from 'lucide-react'
import { CARD_GRADE_META, DRAW_TYPE_LABEL } from '@kbokkang/shared'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { repositories } from '@/lib/repositories'
import { formatNumber, formatPercent } from '@/lib/format'
import { RateComparisonChart } from './_components/rate-comparison-chart'
import { PointFlowChart } from './_components/point-flow-chart'
import { CardSpreadTable } from './_components/card-spread-table'

const FLOW_DAYS = 14

/** 표본이 이보다 적으면 실제 분포를 신뢰할 수 없다고 안내한다 */
const MIN_RELIABLE_SAMPLE = 100

/** 통계 — 어드민 기획서 3.6 */
const StatsPage = async () => {
  const [drawStats, cardSpread, pointFlow, summary] = await Promise.all([
    repositories.stats.drawStats(),
    repositories.stats.cardSpread(),
    repositories.stats.pointFlow(FLOW_DAYS),
    repositories.stats.dashboard(),
  ])

  const neverOwned = cardSpread.filter((row) => row.ownerCount === 0)
  const flowTotals = pointFlow.reduce(
    (acc, point) => ({ issued: acc.issued + point.issued, spent: acc.spent + point.spent }),
    { issued: 0, spent: 0 },
  )

  return (
    <>
      <PageHeader title="통계" description="확률 검증, 카드 보유 현황, 포인트 추이" />

      <Tabs defaultValue="rates">
        <TabsList>
          <TabsTrigger value="rates">확률 검증</TabsTrigger>
          <TabsTrigger value="spread">카드 보유 현황</TabsTrigger>
          <TabsTrigger value="points">포인트 추이</TabsTrigger>
        </TabsList>

        {/* 확률 검증 */}
        <TabsContent value="rates" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {drawStats.map((stats) => {
              const sample = stats.rates.reduce((sum, rate) => sum + rate.drawCount, 0)

              return (
                <Card key={stats.drawType}>
                  <CardHeader>
                    <CardTitle className="text-base">{DRAW_TYPE_LABEL[stats.drawType]}</CardTitle>
                    <p className="text-muted-foreground text-xs">
                      표본 {formatNumber(sample)}회
                      {sample < MIN_RELIABLE_SAMPLE && ' · 표본이 적어 편차가 크게 보입니다'}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <RateComparisonChart stats={stats} />

                    <div className="space-y-1.5 border-t pt-4">
                      {stats.rates.map((rate) => {
                        const diff = rate.actualRate - rate.expectedRate

                        return (
                          <div key={rate.grade} className="flex items-center gap-2 text-xs">
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={{ backgroundColor: CARD_GRADE_META[rate.grade].color }}
                              aria-hidden
                            />
                            <span className="text-muted-foreground w-12">
                              {CARD_GRADE_META[rate.grade].label}
                            </span>
                            <span className="tabular text-muted-foreground w-14 text-right">
                              {formatPercent(rate.expectedRate)}
                            </span>
                            <span className="text-muted-foreground/50">→</span>
                            <span className="tabular w-14 text-right font-semibold">
                              {formatPercent(rate.actualRate)}
                            </span>
                            <span
                              className={`tabular ml-auto w-16 text-right font-medium ${
                                Math.abs(diff) < 1
                                  ? 'text-muted-foreground'
                                  : diff > 0
                                    ? 'text-success'
                                    : 'text-destructive'
                              }`}
                            >
                              {diff > 0 ? '+' : ''}
                              {formatPercent(diff)}
                            </span>
                            <span className="tabular text-muted-foreground w-12 text-right">
                              {formatNumber(rate.drawCount)}회
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <p className="text-muted-foreground text-xs leading-relaxed">
            설정 확률은 <code>packages/shared</code>의 <code>DRAW_GRADE_RATES</code> 값입니다. 실제
            분포가 계속 벗어나면 서버 추첨 로직을 먼저 확인하세요(확률표 수정이 아니라 버그일 수
            있습니다).
          </p>
        </TabsContent>

        {/* 카드 보유 현황 */}
        <TabsContent value="spread" className="space-y-4">
          {neverOwned.length > 0 && (
            <div className="border-warning/40 bg-warning/5 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3">
              <TriangleAlert className="text-warning size-4 shrink-0" aria-hidden />
              <p className="text-sm font-semibold">
                아무도 보유하지 않은 카드 {formatNumber(neverOwned.length)}종
              </p>
              <p className="text-muted-foreground text-xs">
                {neverOwned
                  .slice(0, 6)
                  .map((row) => row.dexNo)
                  .join(', ')}
                {neverOwned.length > 6 && ` 외 ${String(neverOwned.length - 6)}종`}
              </p>
            </div>
          )}

          <Card className="overflow-hidden py-0">
            <CardContent className="px-0">
              <CardSpreadTable rows={cardSpread} totalUsers={summary.totalUsers} />
            </CardContent>
          </Card>

          <p className="text-muted-foreground text-xs">
            발급 장수는 중복 포함입니다. 특정 카드만 몰리면 해당 등급 안의 <code>draw_weight</code>
            를 조정하세요.
          </p>
        </TabsContent>

        {/* 포인트 추이 */}
        <TabsContent value="points" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">최근 {FLOW_DAYS}일 포인트 흐름</CardTitle>
              <p className="text-muted-foreground text-xs">
                유입 {formatNumber(flowTotals.issued)}p · 소비 {formatNumber(flowTotals.spent)}p ·
                순증감{' '}
                <span
                  className={
                    flowTotals.issued - flowTotals.spent >= 0 ? 'text-success' : 'text-destructive'
                  }
                >
                  {flowTotals.issued - flowTotals.spent >= 0 ? '+' : '−'}
                  {formatNumber(Math.abs(flowTotals.issued - flowTotals.spent))}p
                </span>
              </p>
            </CardHeader>

            <CardContent>
              <PointFlowChart flow={pointFlow} />
            </CardContent>
          </Card>

          <p className="text-muted-foreground text-xs leading-relaxed">
            유입이 소비를 계속 앞지르면 포인트가 쌓여 뽑기 동기가 약해집니다. 판매·환급가를 뽑기
            비용보다 훨씬 낮게 둔 이유이기도 합니다.
          </p>
        </TabsContent>
      </Tabs>
    </>
  )
}

export default StatsPage
