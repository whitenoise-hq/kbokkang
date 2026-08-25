import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/format'

/** 목록 페이지네이션. 쿼리스트링 기반이라 서버 컴포넌트에서 그대로 쓴다. */
export const Pager = ({
  basePath,
  params,
  page,
  pageSize,
  total,
}: {
  basePath: string
  params: Record<string, string | undefined>
  page: number
  pageSize: number
  total: number
}) => {
  const lastPage = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const hrefFor = (target: number) => {
    const next = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') next.set(key, value)
    })
    if (target > 1) next.set('page', String(target))

    const query = next.toString()
    return query === '' ? basePath : `${basePath}?${query}`
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-muted-foreground tabular text-xs">
        전체 {formatNumber(total)}건 중 {formatNumber(from)}–{formatNumber(to)}
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          asChild={page > 1}
          aria-label="이전 페이지"
        >
          {page > 1 ? (
            <Link href={hrefFor(page - 1)}>
              <ChevronLeft className="size-4" />
            </Link>
          ) : (
            <span>
              <ChevronLeft className="size-4" />
            </span>
          )}
        </Button>

        <span className="tabular px-2 text-xs font-medium">
          {page} / {lastPage}
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled={page >= lastPage}
          asChild={page < lastPage}
          aria-label="다음 페이지"
        >
          {page < lastPage ? (
            <Link href={hrefFor(page + 1)}>
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span>
              <ChevronRight className="size-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
