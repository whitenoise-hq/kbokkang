import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeaderSkeleton } from '@/components/skeletons/skeleton-parts'

/** 통계 스켈레톤 — 탭 + 차트 2개(확률 검증 탭이 기본) */
const StatsLoading = () => (
  <>
    <PageHeaderSkeleton actions={0} />

    <div className="flex gap-1">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-9 w-28 rounded-md" />
      ))}
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 2 }, (_, index) => (
        <Card key={index}>
          <CardHeader className="space-y-1">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-[220px] w-full rounded-lg" />
            <div className="space-y-2 border-t pt-4">
              {Array.from({ length: 5 }, (_, row) => (
                <Skeleton key={row} className="h-3 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </>
)

export default StatsLoading
