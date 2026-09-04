import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { DRAW_TYPE_LABEL, POINT_REASON_LABEL, sellPriceOf } from '@kbokkang/shared'
import { PageHeader } from '@/components/page-header'
import { GradeBadge } from '@/components/grade-badge'
import { TeamChip } from '@/components/team-chip'
import { DexProgressBar } from '@/components/dex-progress-bar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { repositories } from '@/lib/repositories'
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatPoints,
  formatSignedPoints,
  toPercent,
} from '@/lib/format'
import { PointAdjustDialog } from './_components/point-adjust-dialog'

/** 유저 상세 — 어드민 기획서 3.4 */
const UserDetailPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const [user, teams] = await Promise.all([
    repositories.users.findDetail(id),
    repositories.teams.list(),
  ])

  if (user === null) notFound()

  const team = teams.find((item) => item.id === user.favoriteTeamId) ?? null
  const totalKinds = user.dexProgress.reduce((sum, item) => sum + item.total, 0)
  const ownedKinds = user.dexProgress.reduce((sum, item) => sum + item.owned, 0)
  const hitRate = toPercent(
    user.record.winHits + user.record.scoreHits,
    user.record.resolvedPredictions,
  )

  return (
    <>
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
        <Link href="/users">
          <ChevronLeft className="size-4" />
          유저 목록
        </Link>
      </Button>

      <PageHeader
        title={user.nickname}
        description={`가입 ${formatDate(user.createdAt)}`}
        action={
          <PointAdjustDialog
            userId={user.id}
            nickname={user.nickname}
            currentPoints={user.points}
          />
        }
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="gap-0 py-5">
          <CardContent className="space-y-1 px-6">
            <p className="text-muted-foreground text-sm font-medium">보유 포인트</p>
            <p className="tabular text-3xl font-bold">{formatNumber(user.points)}</p>
          </CardContent>
        </Card>

        <Card className="gap-0 py-5">
          <CardContent className="space-y-1 px-6">
            <p className="text-muted-foreground text-sm font-medium">응원팀</p>
            <p className="pt-1.5 text-lg font-semibold">
              <TeamChip team={team} />
            </p>
          </CardContent>
        </Card>

        <Card className="gap-0 py-5">
          <CardContent className="space-y-1 px-6">
            <p className="text-muted-foreground text-sm font-medium">도감 진행률</p>
            <p className="tabular text-3xl font-bold">
              {formatPercent(toPercent(ownedKinds, totalKinds), 0)}
            </p>
            <p className="text-muted-foreground tabular text-xs">
              {ownedKinds} / {totalKinds}종
            </p>
          </CardContent>
        </Card>

        <Card className="gap-0 py-5">
          <CardContent className="space-y-1 px-6">
            <p className="text-muted-foreground text-sm font-medium">예측 적중률</p>
            <p className="tabular text-3xl font-bold">{formatPercent(hitRate, 0)}</p>
            <p className="text-muted-foreground tabular text-xs">
              {user.record.resolvedPredictions}회 중 {user.record.winHits + user.record.scoreHits}회
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">등급별 도감</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {user.dexProgress.map((item) => (
              <DexProgressBar
                key={item.grade}
                grade={item.grade}
                owned={item.owned}
                total={item.total}
              />
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">예측 성적</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">총 예측</p>
              <p className="tabular text-xl font-bold">{user.record.totalPredictions}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">승패 적중</p>
              <p className="tabular text-xl font-bold">{user.record.winHits}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">스코어 적중</p>
              <p className="tabular text-success text-xl font-bold">{user.record.scoreHits}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">최고 연승</p>
              <p className="tabular text-xl font-bold">{user.record.bestStreak}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cards">
        <TabsList>
          <TabsTrigger value="cards">보유 카드 {user.ownedCards.length}</TabsTrigger>
          <TabsTrigger value="draws">뽑기 이력 {user.draws.length}</TabsTrigger>
          <TabsTrigger value="points">포인트 내역 {user.pointTransactions.length}</TabsTrigger>
        </TabsList>

        <TabsContent value="cards">
          <Card className="overflow-hidden py-0">
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">도감번호</TableHead>
                    <TableHead>카드</TableHead>
                    <TableHead className="w-24">등급</TableHead>
                    <TableHead className="w-20 text-right">수량</TableHead>
                    <TableHead className="w-24 text-right">판매 가능</TableHead>
                    <TableHead className="w-28">최초 획득</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.ownedCards.map((card) => (
                    <TableRow key={card.cardId}>
                      <TableCell className="tabular font-mono text-xs font-semibold">
                        {card.dexNo}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{card.name}</TableCell>
                      <TableCell>
                        <GradeBadge grade={card.grade} />
                      </TableCell>
                      <TableCell className="tabular text-right text-sm">{card.count}</TableCell>
                      <TableCell className="tabular text-muted-foreground text-right text-xs">
                        {card.count > 1
                          ? `${card.count - 1}장 · ${formatPoints((card.count - 1) * sellPriceOf(card.grade))}`
                          : '마지막 1장'}
                      </TableCell>
                      <TableCell className="tabular text-muted-foreground text-xs">
                        {formatDate(card.acquiredAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="draws">
          <Card className="overflow-hidden py-0">
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-36">시각</TableHead>
                    <TableHead className="w-28">뽑기</TableHead>
                    <TableHead>결과 카드</TableHead>
                    <TableHead className="w-24">등급</TableHead>
                    <TableHead className="w-20 text-right">비용</TableHead>
                    <TableHead className="w-28 text-right">중복 환급</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.draws.map((draw) => (
                    <TableRow key={draw.id}>
                      <TableCell className="tabular text-muted-foreground text-xs">
                        {formatDateTime(draw.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={draw.drawType === 'premium' ? 'default' : 'secondary'}>
                          {DRAW_TYPE_LABEL[draw.drawType]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="tabular text-muted-foreground mr-1.5 font-mono text-xs">
                          {draw.cardDexNo}
                        </span>
                        {draw.cardName}
                      </TableCell>
                      <TableCell>
                        <GradeBadge grade={draw.cardGrade} />
                      </TableCell>
                      <TableCell className="tabular text-destructive text-right text-sm">
                        −{formatNumber(draw.cost)}
                      </TableCell>
                      <TableCell className="tabular text-right text-sm">
                        {draw.isDuplicate ? (
                          <span className="text-success">+{formatNumber(draw.refundPoints)}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">신규</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="points">
          <Card className="overflow-hidden py-0">
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-36">시각</TableHead>
                    <TableHead className="w-32">사유</TableHead>
                    <TableHead>메모</TableHead>
                    <TableHead className="w-24 text-right">변동</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.pointTransactions.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="tabular text-muted-foreground text-xs">
                        {formatDateTime(item.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm">{POINT_REASON_LABEL[item.reason]}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {item.memo ?? '-'}
                      </TableCell>
                      <TableCell
                        className={`tabular text-right text-sm font-semibold ${
                          item.amount > 0 ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {formatSignedPoints(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}

export default UserDetailPage
