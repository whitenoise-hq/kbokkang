import Link from 'next/link'
import { Layers } from 'lucide-react'
import type { CardSpreadRow } from '@kbokkang/shared'
import { GradeBadge } from '@/components/grade-badge'
import { EmptyState } from '@/components/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatNumber, formatPercent, toPercent } from '@/lib/format'

/**
 * 카드별 보유 현황 — 어드민 기획서 3.6.
 * 많이 풀린 카드와 아무도 못 뽑은 카드를 함께 봐야 draw_weight 조정 판단이 된다.
 */
export const CardSpreadTable = ({
  rows,
  totalUsers,
}: {
  rows: readonly CardSpreadRow[]
  totalUsers: number
}) => {
  if (rows.length === 0) {
    return <EmptyState icon={Layers} title="집계할 카드가 없습니다" />
  }

  const maxIssued = Math.max(...rows.map((row) => row.issuedCount), 1)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-20">도감번호</TableHead>
          <TableHead>카드</TableHead>
          <TableHead className="w-24">등급</TableHead>
          <TableHead className="w-28 text-right">보유 유저</TableHead>
          <TableHead className="w-36">발급 장수</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.cardId}>
            <TableCell className="tabular font-mono text-xs font-semibold">
              <Link href={`/cards/${row.cardId}`} className="hover:underline">
                {row.dexNo}
              </Link>
            </TableCell>

            <TableCell className="text-sm font-medium">{row.name}</TableCell>

            <TableCell>
              <GradeBadge grade={row.grade} />
            </TableCell>

            <TableCell className="tabular text-right text-sm">
              {row.ownerCount === 0 ? (
                <span className="text-warning text-xs font-medium">아무도 없음</span>
              ) : (
                <>
                  {formatNumber(row.ownerCount)}
                  <span className="text-muted-foreground ml-1.5 text-[11px]">
                    {formatPercent(toPercent(row.ownerCount, totalUsers), 0)}
                  </span>
                </>
              )}
            </TableCell>

            <TableCell>
              <div className="flex items-center gap-2.5">
                <div className="bg-muted h-1.5 w-16 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${toPercent(row.issuedCount, maxIssued)}%` }}
                  />
                </div>
                <span className="tabular text-muted-foreground text-xs">
                  {formatNumber(row.issuedCount)}장
                </span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
