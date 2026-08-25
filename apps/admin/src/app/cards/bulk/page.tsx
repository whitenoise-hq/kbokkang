import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { CARD_GRADES, CARD_GRADE_META, type CardGrade } from '@kbokkang/shared'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { repositories } from '@/lib/repositories'
import { BulkUploader } from './_components/bulk-uploader'

/**
 * 카드 일괄 업로드.
 * 기획서 4장의 등록 워크플로우는 1장씩이지만 목표가 150장이라 일괄 경로를 둔다.
 */
const BulkUploadPage = async () => {
  const counts = await Promise.all(
    CARD_GRADES.map(
      async (grade) => [grade, await repositories.cards.countByGrade(grade)] as const,
    ),
  )
  const countByGrade = Object.fromEntries(counts) as Record<CardGrade, number>

  return (
    <>
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
        <Link href="/cards">
          <ChevronLeft className="size-4" />
          카드 목록
        </Link>
      </Button>

      <PageHeader
        title="카드 일괄 업로드"
        description="여러 장을 한 번에 등록합니다. 도감번호는 목록 순서대로 자동 부여됩니다"
      />

      <div className="bg-muted/50 flex flex-wrap gap-x-5 gap-y-1.5 rounded-lg px-4 py-3">
        <span className="text-muted-foreground text-xs font-medium">등급별 현재 등록 수</span>
        {CARD_GRADES.map((grade) => (
          <span key={grade} className="text-xs">
            <span style={{ color: CARD_GRADE_META[grade].color }} className="font-semibold">
              {CARD_GRADE_META[grade].prefix}
            </span>
            <span className="tabular ml-1">{countByGrade[grade]}장</span>
          </span>
        ))}
      </div>

      <BulkUploader countByGrade={countByGrade} />
    </>
  )
}

export default BulkUploadPage
