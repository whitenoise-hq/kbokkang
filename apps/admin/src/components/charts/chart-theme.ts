/**
 * recharts 공용 스타일. 차트마다 색·폰트를 즉흥으로 정하지 말고 여기서 참조한다.
 * 축선·틱선은 지우고 작은 muted 틱만 남기는 톤(hatch-it 규격).
 */

export const chartTooltipProps = {
  contentStyle: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    fontSize: 12,
    boxShadow: '0 4px 16px rgb(0 0 0 / 0.1)',
    padding: '8px 12px',
  },
  labelStyle: { color: 'var(--muted-foreground)', fontSize: 11, marginBottom: 2 },
  itemStyle: { color: 'var(--foreground)', fontSize: 12, padding: 0 },
} as const

export const chartAxisTick = { fontSize: 10, fill: 'var(--muted-foreground)' } as const

export const chartGridStroke = 'var(--border)'
