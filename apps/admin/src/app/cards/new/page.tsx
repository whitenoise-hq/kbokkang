import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { CARD_GRADES, type CardGrade } from '@kbokkang/shared'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { repositories } from '@/lib/repositories'
import { CardForm } from '../_components/card-form'

/** 카드 등록 — 어드민 기획서 3.3 */
const NewCardPage = async () => {
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

      <PageHeader title="카드 등록" description="등급을 선택하면 도감번호가 자동으로 부여됩니다" />

      <CardForm card={null} countByGrade={countByGrade} />
    </>
  )
}

export default NewCardPage
