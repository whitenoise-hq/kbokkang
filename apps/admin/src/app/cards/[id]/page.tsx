import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { CARD_GRADES, type CardGrade } from '@kbokkang/shared'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { repositories } from '@/lib/repositories'
import { formatDateTime } from '@/lib/format'
import { CardForm } from '../_components/card-form'
import { CardDeleteButton } from './_components/card-delete-button'

/** 카드 수정 — 어드민 기획서 3.3 */
const EditCardPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const card = await repositories.cards.findById(id)

  if (card === null) notFound()

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
        title={card.name}
        description={`${card.dexNo} · 등록 ${formatDateTime(card.createdAt)}`}
        action={
          <CardDeleteButton cardId={card.id} dexNo={card.dexNo} deleted={card.deletedAt !== null} />
        }
      />

      {card.deletedAt !== null && (
        <div className="bg-muted flex items-center gap-2 rounded-lg px-4 py-3">
          <Badge variant="outline">삭제됨</Badge>
          <p className="text-muted-foreground text-xs">
            {formatDateTime(card.deletedAt)}에 숨김 처리된 카드입니다. 뽑기 대상에서 제외됩니다.
          </p>
        </div>
      )}

      <CardForm card={card} countByGrade={countByGrade} />
    </>
  )
}

export default EditCardPage
