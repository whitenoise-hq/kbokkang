import {
  FilterBarSkeleton,
  PageHeaderSkeleton,
  PagerSkeleton,
  TableSkeleton,
} from '@/components/skeletons/skeleton-parts'

/** 카드 목록 스켈레톤 — 컬럼 7개(도감번호·카드·등급·종류·가중치·판매가·등록일) */
const CardsLoading = () => (
  <>
    <PageHeaderSkeleton actions={2} />
    <FilterBarSkeleton selects={3} />
    <TableSkeleton rows={10} cols={7} />
    <PagerSkeleton />
  </>
)

export default CardsLoading
