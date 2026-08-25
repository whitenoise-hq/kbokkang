import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

/** 대시보드 요약 지표 타일. 숫자를 크게(디자인 가이드 display 톤). */
export const StatCard = ({
  label,
  value,
  unit,
  hint,
  icon: Icon,
}: {
  label: string
  value: string
  unit?: string
  hint?: string
  icon: LucideIcon
}) => (
  <Card className="gap-0 py-5">
    <CardContent className="px-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        <Icon className="text-muted-foreground/60 size-4 shrink-0" aria-hidden />
      </div>

      <p className="mt-3 flex items-baseline gap-1">
        <span className="tabular text-3xl font-bold tracking-tight">{value}</span>
        {unit !== undefined && (
          <span className="text-muted-foreground text-sm font-medium">{unit}</span>
        )}
      </p>

      {hint !== undefined && <p className="text-muted-foreground mt-1.5 text-xs">{hint}</p>}
    </CardContent>
  </Card>
)
