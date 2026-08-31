'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { deleteCard, restoreCard } from '../../actions'

/** 카드 삭제/복구. 보유자 정합성 때문에 soft delete만 수행한다. */
export const CardDeleteButton = ({
  cardId,
  dexNo,
  deleted,
}: {
  cardId: string
  dexNo: string
  deleted: boolean
}) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const run = (action: () => Promise<{ ok: boolean; message: string }>) => {
    startTransition(async () => {
      const result = await action()
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
      router.refresh()
    })
  }

  if (deleted) {
    return (
      <Button variant="outline" disabled={pending} onClick={() => run(() => restoreCard(cardId))}>
        <Undo2 className="size-4" />
        복구
      </Button>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={pending}>
          <Trash2 className="size-4" />
          삭제
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dexNo} 카드를 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription className="leading-relaxed">
            이미 유저가 보유한 카드일 수 있어 실제로 지우지 않고 숨김 처리(soft delete)합니다.
            도감번호 {dexNo}는 재사용되지 않으며, 언제든 복구할 수 있습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction onClick={() => run(() => deleteCard(cardId))}>삭제</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
