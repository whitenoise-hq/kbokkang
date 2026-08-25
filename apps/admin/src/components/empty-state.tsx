import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/** 조회 결과 0건 상태 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <div className="bg-muted text-muted-foreground grid size-11 place-items-center rounded-full">
      <Icon className="size-5" aria-hidden />
    </div>
    <div className="space-y-1">
      <p className="text-sm font-semibold">{title}</p>
      {description !== undefined && <p className="text-muted-foreground text-xs">{description}</p>}
    </div>
    {action}
  </div>
)
