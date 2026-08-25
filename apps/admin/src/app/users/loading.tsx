import {
  PageHeaderSkeleton,
  PagerSkeleton,
  TableSkeleton,
} from '@/components/skeletons/skeleton-parts'
import { Skeleton } from '@/components/ui/skeleton'

/** 유저 목록 스켈레톤 — 컬럼 5개(닉네임·응원팀·포인트·도감 진행률·가입일) */
const UsersLoading = () => (
  <>
    <PageHeaderSkeleton actions={0} />
    <Skeleton className="h-9 w-64 rounded-md" />
    <TableSkeleton rows={10} cols={5} />
    <PagerSkeleton />
  </>
)

export default UsersLoading
