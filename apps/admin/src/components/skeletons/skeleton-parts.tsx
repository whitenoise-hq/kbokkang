import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * 라우트 loading.tsx 에서 쓰는 스켈레톤 조각.
 * 원칙: 실제 레이아웃과 같은 구조·높이로 만들어 콘텐츠 전환 시 튀지 않게 한다.
 * 레이아웃의 <main> 이 이미 컨테이너/여백을 주므로 여기서는 내용만 그린다.
 */

/** 페이지 제목 + 설명 + 우측 액션 */
export const PageHeaderSkeleton = ({ actions = 1 }: { actions?: number }) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div className="space-y-2">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-4 w-64" />
    </div>
    <div className="flex gap-2">
      {Array.from({ length: actions }, (_, index) => (
        <Skeleton key={index} className="h-9 w-24 rounded-md" />
      ))}
    </div>
  </div>
)

/** 필터·검색 줄 */
export const FilterBarSkeleton = ({ selects = 3 }: { selects?: number }) => (
  <div className="flex flex-wrap items-center gap-2">
    <Skeleton className="h-9 w-56 rounded-md" />
    {Array.from({ length: selects }, (_, index) => (
      <Skeleton key={index} className="h-9 w-28 rounded-md" />
    ))}
  </div>
)

/** 테이블 — 헤더 배경·행 높이를 실제 테이블과 맞춘다 */
export const TableSkeleton = ({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) => (
  <Card className="overflow-hidden py-0">
    <CardContent className="px-0">
      <div className="bg-muted/40 flex h-11 items-center gap-4 border-b px-4">
        {Array.from({ length: cols }, (_, index) => (
          <Skeleton key={index} className="h-3 flex-1" />
        ))}
      </div>

      {Array.from({ length: rows }, (_, rowIndex) => (
        <div
          key={rowIndex}
          className="border-border/60 flex items-center gap-4 border-b px-4 py-3.5 last:border-0"
        >
          {Array.from({ length: cols }, (_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </CardContent>
  </Card>
)

/** 페이지네이션 줄 */
export const PagerSkeleton = () => (
  <div className="flex items-center justify-between gap-4">
    <Skeleton className="h-3 w-32" />
    <div className="flex items-center gap-1">
      <Skeleton className="size-8 rounded-md" />
      <Skeleton className="h-3 w-10" />
      <Skeleton className="size-8 rounded-md" />
    </div>
  </div>
)

/** 요약 지표 타일 묶음 */
export const StatCardsSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: count }, (_, index) => (
      <Card key={index} className="gap-0 py-5">
        <CardContent className="space-y-3 px-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-28" />
        </CardContent>
      </Card>
    ))}
  </div>
)

/** 제목 + 본문 줄들로 구성된 카드 */
export const PanelSkeleton = ({ lines = 5, className }: { lines?: number; className?: string }) => (
  <Card className={className}>
    <CardHeader>
      <Skeleton className="h-5 w-28" />
    </CardHeader>
    <CardContent className="space-y-3">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className="h-4 w-full" />
      ))}
    </CardContent>
  </Card>
)
