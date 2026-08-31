'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { CARD_GRADE_META, type CardGradeCount } from '@kbokkang/shared'
import { chartTooltipProps } from '@/components/charts/chart-theme'
import { formatNumber } from '@/lib/format'

/**
 * 등급별 카드 수 도넛 차트.
 * 조각 색은 @kbokkang/shared 의 등급색을 그대로 쓴다(별도 팔레트 정의 금지).
 * 가운데에는 총 장수를 얹어 구성비와 총량을 동시에 읽게 한다.
 */
export const GradeDonutChart = ({ cardsByGrade }: { cardsByGrade: readonly CardGradeCount[] }) => {
  const data = cardsByGrade.map(({ grade, count }) => ({
    name: CARD_GRADE_META[grade].label,
    value: count,
    color: CARD_GRADE_META[grade].color,
  }))

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="relative h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={2}
            stroke="none"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((item) => (
              <Cell key={item.name} fill={item.color} />
            ))}
          </Pie>
          {/* recharts 3 의 Formatter 시그니처를 그대로 쓰도록 매개변수 타입은 추론에 맡긴다 */}
          <Tooltip
            {...chartTooltipProps}
            formatter={(value, name) => [`${formatNumber(Number(value))}장`, String(name)]}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* 가운데 총량 — 도넛 구멍에 겹쳐 표시 */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular text-2xl font-bold tracking-tight">{formatNumber(total)}</span>
        <span className="text-muted-foreground text-[11px]">총 카드</span>
      </div>
    </div>
  )
}
