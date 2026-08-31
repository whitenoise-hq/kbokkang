'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CARD_GRADE_META, type DrawStats } from '@kbokkang/shared'
import { chartAxisTick, chartGridStroke, chartTooltipProps } from '@/components/charts/chart-theme'

/**
 * 설정 확률 vs 실제 분포 — 확률 검증(어드민 기획서 3.6).
 * 두 막대를 나란히 놓아 설정값에서 얼마나 벗어났는지 본다.
 * 표본이 적으면 편차가 크게 보이는 게 정상이므로 화면에서 표본 수를 함께 안내한다.
 */
export const RateComparisonChart = ({ stats }: { stats: DrawStats }) => {
  const data = stats.rates.map((rate) => ({
    label: CARD_GRADE_META[rate.grade].label,
    설정: rate.expectedRate,
    실제: Number(rate.actualRate.toFixed(2)),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid stroke={chartGridStroke} vertical={false} />
        <XAxis dataKey="label" tick={chartAxisTick} axisLine={false} tickLine={false} />
        <YAxis
          tick={chartAxisTick}
          axisLine={false}
          tickLine={false}
          unit="%"
          allowDecimals={false}
        />
        <Tooltip
          {...chartTooltipProps}
          formatter={(value, name) => [`${String(value)}%`, String(name)]}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
        <Bar dataKey="설정" fill="var(--muted-foreground)" radius={[3, 3, 0, 0]} maxBarSize={28} />
        <Bar dataKey="실제" fill="var(--primary)" radius={[3, 3, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  )
}
