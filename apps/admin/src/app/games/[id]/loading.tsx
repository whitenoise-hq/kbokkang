import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeaderSkeleton, TableSkeleton } from '@/components/skeletons/skeleton-parts'

/** 경기 상세 스켈레톤 — 스코어보드 + 예측 분포 + 예측 로그 */
const GameDetailLoading = () => (
  <>
    <Skeleton className="h-8 w-24 rounded-md" />
    <PageHeaderSkeleton />

    <Card>
      <CardContent className="flex items-center justify-center gap-8 py-2">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            {index === 1 ? (
              <Skeleton className="h-10 w-28" />
            ) : (
              <>
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-3 w-8" />
              </>
            )}
          </div>
        ))}
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="space-y-1">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-3 w-56" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-2.5 w-full rounded-full" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>

    <TableSkeleton rows={8} cols={6} />
  </>
)

export default GameDetailLoading
