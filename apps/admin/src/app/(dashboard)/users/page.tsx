import Link from 'next/link'
import { Users as UsersIcon } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Pager } from '@/components/pager'
import { TeamChip } from '@/components/team-chip'
import { EmptyState } from '@/components/empty-state'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { repositories, DEFAULT_PAGE_SIZE } from '@/lib/repositories'
import { formatDate, formatNumber, formatPercent, formatPoints, toPercent } from '@/lib/format'
import { UserSearch } from './_components/user-search'

/** 유저 관리 — 어드민 기획서 3.4 */
const UsersPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ keyword?: string; page?: string }>
}) => {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? '1') || 1)

  const [result, teams, totalCards] = await Promise.all([
    repositories.users.list(params.keyword ?? '', { page, pageSize: DEFAULT_PAGE_SIZE }),
    repositories.teams.list(),
    repositories.stats.dashboard().then((summary) => summary.totalCards),
  ])

  return (
    <>
      <PageHeader title="유저 관리" description={`도감 진행률은 전체 ${totalCards}종 기준입니다`} />

      <UserSearch />

      <Card className="overflow-hidden py-0">
        <CardContent className="px-0">
          {result.items.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="조건에 맞는 유저가 없습니다"
              description="닉네임 검색어를 바꿔 보세요"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>닉네임</TableHead>
                  <TableHead className="w-24">응원팀</TableHead>
                  <TableHead className="w-28 text-right">보유 포인트</TableHead>
                  <TableHead className="w-44">도감 진행률</TableHead>
                  <TableHead className="w-28">가입일</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {result.items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Link
                        href={`/users/${user.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {user.nickname}
                      </Link>
                    </TableCell>

                    <TableCell>
                      <TeamChip team={teams.find((team) => team.id === user.favoriteTeamId)} />
                    </TableCell>

                    <TableCell className="tabular text-right text-sm font-semibold">
                      {formatPoints(user.points)}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="bg-muted h-1.5 w-20 overflow-hidden rounded-full">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${toPercent(user.ownedCardKinds, totalCards)}%` }}
                          />
                        </div>
                        <span className="tabular text-muted-foreground text-xs">
                          {formatNumber(user.ownedCardKinds)}/{formatNumber(totalCards)}
                          <span className="ml-1.5">
                            {formatPercent(toPercent(user.ownedCardKinds, totalCards), 0)}
                          </span>
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="tabular text-muted-foreground text-xs">
                      {formatDate(user.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Pager
        basePath="/users"
        params={{ keyword: params.keyword }}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
      />
    </>
  )
}

export default UsersPage
