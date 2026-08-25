import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeaderSkeleton, TableSkeleton } from '@/components/skeletons/skeleton-parts'

/** 경기 관리 스켈레톤 — 크롤링 상태 + 날짜 이동 + 테이블 6열(하루 단위, 페이저 없음) */
const GamesLoading = () => (
  <>
    <PageHeaderSkeleton actions={0} />

    <Card className="gap-0 py-4">
      <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="ml-auto h-3 w-44" />
      </CardContent>
    </Card>

    <Card className="gap-0 py-3">
      <CardContent className="flex flex-wrap items-center gap-2 px-3">
        <Skeleton className="size-9 rounded-md" />
        <Skeleton className="h-9 w-44 rounded-md" />
        <Skeleton className="size-9 rounded-md" />
        <Skeleton className="h-8 w-14 rounded-md" />
        <Skeleton className="ml-auto h-9 w-32 rounded-md" />
      </CardContent>
    </Card>

    <TableSkeleton rows={5} cols={6} />
  </>
)

export default GamesLoading
