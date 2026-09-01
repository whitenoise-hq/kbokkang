'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { hexColorSchema, type Team } from '@kbokkang/shared'
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
import { cn } from '@/lib/utils'
import { updateTeam } from '../actions'
import { LogoPicker } from './logo-picker'

/** 구단 수정 다이얼로그 — 팀명·약칭·컬러·로고 */
export const TeamEditDialog = ({ team }: { team: Team }) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const [name, setName] = useState(team.name)
  const [shortName, setShortName] = useState(team.shortName)
  const [color, setColor] = useState(team.color)
  const [logoUrl, setLogoUrl] = useState<string | null>(team.logoUrl)

  const colorValid = hexColorSchema.safeParse(color).success
  const valid = name.trim() !== '' && shortName.trim() !== '' && colorValid

  const submit = () => {
    startTransition(async () => {
      const result = await updateTeam({
        id: team.id,
        name,
        shortName,
        color: color.toUpperCase(),
        logoUrl,
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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        // 닫을 때 편집 내용을 원본으로 되돌린다(저장 안 한 변경이 남지 않게)
        if (!next) {
          setName(team.name)
          setShortName(team.shortName)
          setColor(team.color)
          setLogoUrl(team.logoUrl)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Pencil className="size-4" />
          수정
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>구단 수정</DialogTitle>
          <DialogDescription>{team.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>로고</Label>
            <LogoPicker
              teamId={team.id}
              value={logoUrl}
              color={colorValid ? color : team.color}
              onChange={setLogoUrl}
            />
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-2">
              <Label htmlFor="teamName">팀명</Label>
              <Input
                id="teamName"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={30}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamShortName">약칭</Label>
              <Input
                id="teamShortName"
                value={shortName}
                onChange={(event) => setShortName(event.target.value)}
                maxLength={6}
                className="w-24"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="teamColor">팀 컬러</Label>
            <div className="flex items-center gap-2">
              <input
                id="teamColor"
                type="color"
                value={colorValid ? color : '#000000'}
                onChange={(event) => setColor(event.target.value.toUpperCase())}
                className="size-9 shrink-0 rounded-md border bg-transparent p-1"
                aria-label="팀 컬러 선택"
              />
              <Input
                value={color}
                onChange={(event) => setColor(event.target.value)}
                placeholder="#RRGGBB"
                className={cn('tabular w-32 font-mono', !colorValid && 'border-destructive')}
                aria-label="팀 컬러 hex"
              />
              {!colorValid && (
                <span className="text-destructive text-xs">#RRGGBB 형식이어야 합니다</span>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              경기 목록·응원팀 표기에 쓰입니다. 축약형(#RGB)은 허용하지 않습니다
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            취소
          </Button>
          <Button onClick={submit} disabled={pending || !valid}>
            {pending ? '저장 중…' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
