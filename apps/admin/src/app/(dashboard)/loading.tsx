import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeaderSkeleton, StatCardsSkeleton } from '@/components/skeletons/skeleton-parts'

/** 대시보드 스켈레톤 — 실제 화면과 같은 그리드 구성 */
const DashboardLoading = () => (
  <>
    <PageHeaderSkeleton />
    <StatCardsSkeleton />

    <div className="grid gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader className="space-y-1">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 도넛 차트 자리 */}
          <div className="flex h-[220px] items-center justify-center">
            <Skeleton className="size-[150px] rounded-full" />
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-2 border-t pt-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center gap-2">
                <Skeleton className="size-2 rounded-full" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="ml-auto h-4 w-6" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <Skeleton className="h-5 w-20" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  </>
)

export default DashboardLoading
