import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeaderSkeleton } from '@/components/skeletons/skeleton-parts'

/** 구단 관리 스켈레톤 — 로고 등록 현황 배너 + 구단 카드 격자 */
const TeamsLoading = () => (
  <>
    <PageHeaderSkeleton actions={0} />

    <div className="flex items-center gap-3 rounded-xl border px-4 py-3">
      <Skeleton className="size-4 rounded" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-56" />
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 10 }, (_, index) => (
        <Card key={index} className="gap-0 py-5">
          <CardContent className="space-y-4 px-5">
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 rounded-xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>

            <div className="flex items-center gap-2 border-t pt-3.5">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-3 w-16" />
            </div>

            <Skeleton className="h-8 w-full rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  </>
)

export default TeamsLoading
