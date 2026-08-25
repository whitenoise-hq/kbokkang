'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Gavel } from 'lucide-react'
import { toast } from 'sonner'
import type { GameWithStats, Team } from '@kbokkang/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TeamLogo } from '@/components/team-logo'
import { formatDate, formatNumber } from '@/lib/format'
import { settleGame } from '../actions'

const isValidScore = (value: string): boolean => {
  const parsed = Number(value)
  return value !== '' && Number.isInteger(parsed) && parsed >= 0 && parsed <= 99
}

/**
 * 수동 정산 다이얼로그.
 * 크롤링이 결과를 못 가져온 경기에 운영자가 스코어를 직접 입력한다.
 * 예측 마감·정산은 서버 시각 기준이므로 여기서 시각을 다루지 않는다.
 */
export const SettleDialog = ({
  game,
  homeTeam,
  awayTeam,
}: {
  game: GameWithStats
  homeTeam: Team | undefined
  awayTeam: Team | undefined
}) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const [homeScore, setHomeScore] = useState(game.homeScore?.toString() ?? '')
  const [awayScore, setAwayScore] = useState(game.awayScore?.toString() ?? '')

  const valid = isValidScore(homeScore) && isValidScore(awayScore)
  const isDraw = valid && Number(homeScore) === Number(awayScore)
  const winner = !valid || isDraw ? null : Number(homeScore) > Number(awayScore) ? 'home' : 'away'

  const submit = () => {
    startTransition(async () => {
      const result = await settleGame({
        gameId: game.id,
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
      })

      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Gavel className="size-4" />
          수동 정산
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>수동 정산</DialogTitle>
          <DialogDescription>
            {formatDate(game.gameDate)} · 예측 {formatNumber(game.predictionCount)}건
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="awayScore" className="flex items-center gap-1.5">
                <TeamLogo team={awayTeam} size="sm" />
                {awayTeam?.shortName ?? '원정'}
              </Label>
              <Input
                id="awayScore"
                type="number"
                min={0}
                max={99}
                value={awayScore}
                onChange={(event) => setAwayScore(event.target.value)}
                className="tabular text-center text-lg font-bold"
              />
            </div>

            <span className="text-muted-foreground pb-2.5 text-sm font-semibold">:</span>

            <div className="space-y-2">
              <Label htmlFor="homeScore" className="flex items-center gap-1.5">
                <TeamLogo team={homeTeam} size="sm" />
                {homeTeam?.shortName ?? '홈'}
              </Label>
              <Input
                id="homeScore"
                type="number"
                min={0}
                max={99}
                value={homeScore}
                onChange={(event) => setHomeScore(event.target.value)}
                className="tabular text-center text-lg font-bold"
              />
            </div>
          </div>

          <div className="bg-muted rounded-lg px-3.5 py-2.5 text-xs leading-relaxed">
            {valid ? (
              <p>
                결과:{' '}
                <strong>
                  {isDraw
                    ? '무승부'
                    : `${winner === 'home' ? (homeTeam?.shortName ?? '홈') : (awayTeam?.shortName ?? '원정')} 승`}
                </strong>
                <br />
                <span className="text-muted-foreground">
                  승패 적중 예측에 +30p, 스코어까지 맞힌 예측에 +150p가 지급됩니다
                </span>
              </p>
            ) : (
              <p className="text-muted-foreground">0~99 사이 정수로 양팀 스코어를 입력하세요</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            취소
          </Button>
          <Button onClick={submit} disabled={pending || !valid}>
            {pending ? '정산 중…' : '정산 실행'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
