import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  PageHeaderSkeleton,
  PanelSkeleton,
  TableSkeleton,
} from '@/components/skeletons/skeleton-parts'

/** 유저 상세 스켈레톤 — 지표 4 + 도감/성적 + 탭 테이블 */
const UserDetailLoading = () => (
  <>
    <Skeleton className="h-8 w-24 rounded-md" />
    <PageHeaderSkeleton />

    <div className="grid gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <Card key={index} className="gap-0 py-5">
          <CardContent className="space-y-2 px-6">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>

    <div className="grid gap-4 lg:grid-cols-3">
      <PanelSkeleton lines={5} />

      <Card className="lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-5 w-20" />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-10" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>

    <div className="flex gap-1">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-9 w-28 rounded-md" />
      ))}
    </div>

    <TableSkeleton rows={8} cols={6} />
  </>
)

export default UserDetailLoading
