'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Coins } from 'lucide-react'
import { toast } from 'sonner'
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
import { Textarea } from '@/components/ui/textarea'
import { formatPoints } from '@/lib/format'
import { adjustUserPoints } from '../../actions'

/** 포인트 수동 조정. 사유가 없으면 저장할 수 없다(운영 이력 추적). */
export const PointAdjustDialog = ({
  userId,
  nickname,
  currentPoints,
}: {
  userId: string
  nickname: string
  currentPoints: number
}) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')

  const parsedAmount = Number(amount)
  const valid = Number.isInteger(parsedAmount) && parsedAmount !== 0 && memo.trim() !== ''
  const nextPoints = currentPoints + (Number.isFinite(parsedAmount) ? parsedAmount : 0)

  const submit = () => {
    startTransition(async () => {
      const result = await adjustUserPoints({ userId, amount: parsedAmount, memo: memo.trim() })

      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      setOpen(false)
      setAmount('')
      setMemo('')
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Coins className="size-4" />
          포인트 조정
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>포인트 조정</DialogTitle>
          <DialogDescription>
            {nickname} · 현재 {formatPoints(currentPoints)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">조정 포인트</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="지급은 100, 차감은 -100"
            />
            <p className="text-muted-foreground text-xs">
              조정 후{' '}
              <span
                className={
                  nextPoints < 0 ? 'text-destructive font-semibold' : 'font-semibold text-current'
                }
              >
                {formatPoints(nextPoints)}
              </span>
              {nextPoints < 0 && ' — 음수는 저장되지 않습니다'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="memo">조정 사유</Label>
            <Textarea
              id="memo"
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              placeholder="예: 정산 오류 보상"
              maxLength={200}
              rows={3}
            />
            <p className="text-muted-foreground text-xs">
              포인트 내역에 admin_adjust 로 기록됩니다
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            취소
          </Button>
          <Button onClick={submit} disabled={pending || !valid || nextPoints < 0}>
            {pending ? '저장 중…' : '조정 저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
