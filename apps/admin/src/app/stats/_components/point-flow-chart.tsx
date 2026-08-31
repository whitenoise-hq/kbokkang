'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PointFlowPoint } from '@kbokkang/shared'
import { chartAxisTick, chartGridStroke, chartTooltipProps } from '@/components/charts/chart-theme'

/**
 * 포인트 유입/소비 추이 — 어드민 기획서 3.6.
 * 유입이 소비를 계속 앞지르면 포인트가 쌓여 뽑기 동기가 약해지므로 균형을 본다.
 */
export const PointFlowChart = ({ flow }: { flow: readonly PointFlowPoint[] }) => {
  const data = flow.map((point) => ({
    // MM.DD 로 축을 짧게
    label: point.date.slice(5).replace('-', '.'),
    유입: point.issued,
    소비: point.spent,
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
        <defs>
          <linearGradient id="issuedFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--success)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--success)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="spentFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0.02} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke={chartGridStroke} vertical={false} />
        <XAxis
          dataKey="label"
          tick={chartAxisTick}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis tick={chartAxisTick} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          {...chartTooltipProps}
          formatter={(value, name) => [`${Number(value).toLocaleString('ko-KR')}p`, String(name)]}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />

        <Area
          type="monotone"
          dataKey="유입"
          stroke="var(--success)"
          strokeWidth={2}
          fill="url(#issuedFill)"
        />
        <Area
          type="monotone"
          dataKey="소비"
          stroke="var(--destructive)"
          strokeWidth={2}
          fill="url(#spentFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
