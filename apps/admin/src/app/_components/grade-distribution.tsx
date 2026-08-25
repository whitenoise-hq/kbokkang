import Link from 'next/link'
import { CARD_GRADE_META, type CardGradeCount } from '@kbokkang/shared'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatNumber, formatPercent, toPercent } from '@/lib/format'
import { GradeDonutChart } from './grade-donut-chart'

const MVP_TARGET = 150

/**
 * 등급별 카드 수 — 도넛 차트로 등급 구성비를 본다.
 * 차트 아래에 등급별 수치를 나열해 정확한 값도 함께 확인할 수 있게 한다.
 */
export const GradeDistribution = ({
  cardsByGrade,
  totalCards,
}: {
  cardsByGrade: readonly CardGradeCount[]
  totalCards: number
}) => (
  <Card className="lg:col-span-2">
    <CardHeader>
      <CardTitle className="text-base">등급별 카드 수</CardTitle>
      <p className="text-muted-foreground text-xs">
        목표 {MVP_TARGET}장 중 {formatNumber(totalCards)}장 ·{' '}
        {formatPercent(toPercent(totalCards, MVP_TARGET), 0)}
      </p>
      <CardAction>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/cards">관리</Link>
        </Button>
      </CardAction>
    </CardHeader>

    <CardContent className="space-y-4">
      <GradeDonutChart cardsByGrade={cardsByGrade} />

      <div className="grid grid-cols-2 gap-x-5 gap-y-2 border-t pt-4">
        {cardsByGrade.map(({ grade, count }) => (
          <div key={grade} className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: CARD_GRADE_META[grade].color }}
              aria-hidden
            />
            <span className="text-muted-foreground min-w-0 truncate text-xs">
              {CARD_GRADE_META[grade].label}
            </span>
            <span className="tabular ml-auto text-sm font-bold">{formatNumber(count)}</span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)
