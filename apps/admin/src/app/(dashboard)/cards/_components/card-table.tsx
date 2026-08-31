import Link from 'next/link'
import { Layers } from 'lucide-react'
import type { Card } from '@kbokkang/shared'
import { CARD_TYPE_LABEL, sellPriceOf } from '@kbokkang/shared'
import { GradeBadge, LayoutLabel } from '@/components/grade-badge'
import { EmptyState } from '@/components/empty-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CardThumb } from './card-thumb'
import { formatDate, formatPoints } from '@/lib/format'

/** 카드 목록 테이블. 정렬은 도감번호순(N01→M03) 고정. */
export const CardTable = ({ cards }: { cards: readonly Card[] }) => {
  if (cards.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="조건에 맞는 카드가 없습니다"
        description="필터를 바꾸거나 새 카드를 등록해 주세요"
        action={
          <Button size="sm" asChild>
            <Link href="/cards/new">카드 등록</Link>
          </Button>
        }
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">도감번호</TableHead>
          <TableHead>카드</TableHead>
          <TableHead className="w-24">등급</TableHead>
          <TableHead className="w-24">종류</TableHead>
          <TableHead className="w-20 text-right">가중치</TableHead>
          <TableHead className="w-20 text-right">판매가</TableHead>
          <TableHead className="w-28">등록일</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {cards.map((card) => (
          <TableRow key={card.id} className={card.deletedAt !== null ? 'opacity-50' : undefined}>
            <TableCell className="tabular font-mono text-xs font-semibold">
              <Link href={`/cards/${card.id}`} className="hover:underline">
                {card.dexNo}
              </Link>
            </TableCell>

            <TableCell>
              <Link href={`/cards/${card.id}`} className="flex items-center gap-3 group">
                <CardThumb imageUrl={card.imageUrl} grade={card.grade} name={card.name} />
                <span className="space-y-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm font-medium group-hover:underline">{card.name}</span>
                    {card.isSeason && (
                      <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                        시즌
                      </Badge>
                    )}
                    {card.deletedAt !== null && (
                      <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                        삭제됨
                      </Badge>
                    )}
                  </span>
                  <span className="block">
                    <LayoutLabel grade={card.grade} />
                    {card.imageUrl === null && (
                      <span className="text-destructive ml-1.5 text-xs">이미지 없음</span>
                    )}
                  </span>
                </span>
              </Link>
            </TableCell>

            <TableCell>
              <GradeBadge grade={card.grade} />
            </TableCell>

            <TableCell className="text-muted-foreground text-sm">
              {CARD_TYPE_LABEL[card.type]}
            </TableCell>

            <TableCell className="tabular text-right text-sm">{card.drawWeight}</TableCell>

            <TableCell className="tabular text-muted-foreground text-right text-sm">
              {formatPoints(sellPriceOf(card.grade))}
            </TableCell>

            <TableCell className="tabular text-muted-foreground text-xs">
              {formatDate(card.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
