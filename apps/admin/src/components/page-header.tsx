import type { ReactNode } from 'react'

/** 화면 상단 제목 영역. 우측에 액션 버튼 슬롯. */
export const PageHeader = ({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) => (
  <header className="flex flex-wrap items-end justify-between gap-4">
    <div className="space-y-1">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {description !== undefined && <p className="text-muted-foreground text-sm">{description}</p>}
    </div>
    {action !== undefined && <div className="flex items-center gap-2">{action}</div>}
  </header>
)
