import Link from 'next/link'
import { Plus, Upload } from 'lucide-react'
import { isCardGrade, isCardType, type CardFilter } from '@kbokkang/shared'
import { PageHeader } from '@/components/page-header'
import { Pager } from '@/components/pager'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { repositories, DEFAULT_PAGE_SIZE } from '@/lib/repositories'
import { CardFilters } from './_components/card-filters'
import { CardTable } from './_components/card-table'

interface SearchParams {
  grade?: string
  type?: string
  season?: string
  keyword?: string
  page?: string
}

/** 쿼리스트링 → 도메인 필터. 잘못된 값은 무시한다. */
const toFilter = (params: SearchParams): CardFilter => ({
  grade: params.grade !== undefined && isCardGrade(params.grade) ? params.grade : null,
  type: params.type !== undefined && isCardType(params.type) ? params.type : null,
  isSeason: params.season === 'true' ? true : params.season === 'false' ? false : null,
  keyword: params.keyword ?? '',
  includeDeleted: false,
})

/** 카드 관리 — 어드민 기획서 3.3 (핵심 화면) */
const CardsPage = async ({ searchParams }: { searchParams: Promise<SearchParams> }) => {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? '1') || 1)

  const result = await repositories.cards.list(toFilter(params), {
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  })

  return (
    <>
      <PageHeader
        title="카드 관리"
        description="도감번호는 등급 선택 시 자동 부여됩니다"
        action={
          <>
            <Button variant="outline" asChild>
              <Link href="/cards/bulk">
                <Upload className="size-4" />
                일괄 업로드
              </Link>
            </Button>
            <Button asChild>
              <Link href="/cards/new">
                <Plus className="size-4" />
                카드 등록
              </Link>
            </Button>
          </>
        }
      />

      <CardFilters />

      <Card className="overflow-hidden py-0">
        <CardContent className="px-0">
          <CardTable cards={result.items} />
        </CardContent>
      </Card>

      <Pager
        basePath="/cards"
        params={{
          grade: params.grade,
          type: params.type,
          season: params.season,
          keyword: params.keyword,
        }}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
      />
    </>
  )
}

export default CardsPage
