'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  CARD_GRADES,
  CARD_GRADE_META,
  CARD_TYPES,
  CARD_TYPE_LABEL,
  formatDexNo,
  sellPriceOf,
  type Card,
  type CardGrade,
  type CardType,
} from '@kbokkang/shared'
import { Button } from '@/components/ui/button'
import { Card as UiCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GradeBadge } from '@/components/grade-badge'
import { formatPoints } from '@/lib/format'
import { createCard, updateCard } from '../actions'
import { ImagePicker } from './image-picker'

/**
 * 카드 등록/수정 폼.
 * 도감번호는 입력받지 않고 등급별 기존 장수로 미리보기만 보여준다(실제 부여는 서버).
 */
export const CardForm = ({
  card,
  countByGrade,
}: {
  /** null 이면 신규 등록 */
  card: Card | null
  /** 등급별 기존 카드 수 — 도감번호 미리보기용 */
  countByGrade: Record<CardGrade, number>
}) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [name, setName] = useState(card?.name ?? '')
  const [grade, setGrade] = useState<CardGrade>(card?.grade ?? 'normal')
  const [type, setType] = useState<CardType>(card?.type ?? 'player')
  const [imageUrl, setImageUrl] = useState<string | null>(card?.imageUrl ?? null)
  const [drawWeight, setDrawWeight] = useState(String(card?.drawWeight ?? 1))
  const [isSeason, setIsSeason] = useState(card?.isSeason ?? false)

  const isEdit = card !== null
  const gradeChanged = isEdit && card.grade !== grade

  /** 신규는 다음 번호, 수정은 등급 유지 시 기존 번호 */
  const previewDexNo =
    isEdit && !gradeChanged ? card.dexNo : formatDexNo({ grade, seq: countByGrade[grade] + 1 })

  const submit = () => {
    const payload = {
      name,
      grade,
      type,
      imageUrl,
      drawWeight: Number(drawWeight) || 1,
      isSeason,
    }

    startTransition(async () => {
      const result = isEdit ? await updateCard(card.id, payload) : await createCard(payload)

      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      router.push('/cards')
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <UiCard className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">기본 정보</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">카드 이름</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="예: 홈런 슬러거 태산"
              maxLength={40}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="grade">등급</Label>
              <Select value={grade} onValueChange={(value) => setGrade(value as CardGrade)}>
                <SelectTrigger id="grade" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARD_GRADES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {CARD_GRADE_META[item].label} ({CARD_GRADE_META[item].prefix})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">종류</Label>
              <Select value={type} onValueChange={(value) => setType(value as CardType)}>
                <SelectTrigger id="type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARD_TYPES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {CARD_TYPE_LABEL[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>카드 이미지</Label>
            <ImagePicker grade={grade} value={imageUrl} onChange={setImageUrl} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="drawWeight">뽑기 가중치</Label>
              <Input
                id="drawWeight"
                type="number"
                min={1}
                max={1000}
                value={drawWeight}
                onChange={(event) => setDrawWeight(event.target.value)}
              />
              <p className="text-muted-foreground text-xs">같은 등급 안에서의 상대 확률. 기본 1</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isSeason">시즌 카드</Label>
              <label className="flex h-9 items-center gap-2.5 text-sm" htmlFor="isSeason">
                <Checkbox
                  id="isSeason"
                  checked={isSeason}
                  onCheckedChange={(checked) => setIsSeason(checked === true)}
                />
                시즌·프로모션 카드로 표시
              </label>
            </div>
          </div>
        </CardContent>
      </UiCard>

      <div className="space-y-4">
        <UiCard>
          <CardHeader>
            <CardTitle className="text-base">자동 부여</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs">도감번호</p>
              <p className="tabular font-mono text-2xl font-bold">{previewDexNo}</p>
              <p className="text-muted-foreground text-xs">
                {CARD_GRADE_META[grade].label} 등급 기존 {countByGrade[grade]}장
              </p>
            </div>

            {gradeChanged && (
              <p className="text-destructive bg-destructive/10 rounded-md px-3 py-2 text-xs leading-relaxed">
                등급을 바꾸면 도감번호가 <strong>{previewDexNo}</strong>로 새로 부여됩니다. 기존
                번호 {card.dexNo}는 비게 됩니다.
              </p>
            )}

            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">등급</span>
                <GradeBadge grade={grade} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">레이아웃</span>
                <span className="text-xs font-medium">
                  {CARD_GRADE_META[grade].layout === 'full_art' ? '풀아트' : '박스형'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">반짝임 모션</span>
                <span className="text-xs font-medium">
                  {CARD_GRADE_META[grade].hasShimmer ? '있음' : '없음'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">판매·환급가</span>
                <span className="tabular text-xs font-medium">
                  {formatPoints(sellPriceOf(grade))}
                </span>
              </div>
            </div>

            <p className="text-muted-foreground text-[11px] leading-relaxed">
              판매가는 카드에 저장하지 않고 등급 상수로 계산합니다
            </p>
          </CardContent>
        </UiCard>

        <div className="flex gap-2">
          <Button className="flex-1" onClick={submit} disabled={pending || name.trim() === ''}>
            {pending ? '저장 중…' : isEdit ? '수정 저장' : '카드 등록'}
          </Button>
          <Button variant="outline" onClick={() => router.back()} disabled={pending}>
            취소
          </Button>
        </div>
      </div>
    </div>
  )
}
