'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { CARD_GRADES, CARD_GRADE_META, CARD_TYPES, CARD_TYPE_LABEL } from '@kbokkang/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ALL = 'all'

/** 카드 목록 필터. 상태는 URL 쿼리로 관리해 새로고침·공유 시 유지된다. */
export const CardFilters = () => {
  const router = useRouter()
  const params = useSearchParams()

  const current = {
    grade: params.get('grade') ?? ALL,
    type: params.get('type') ?? ALL,
    season: params.get('season') ?? ALL,
    keyword: params.get('keyword') ?? '',
  }

  const applyParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString())
      if (value === ALL || value === '') next.delete(key)
      else next.set(key, value)
      next.delete('page')

      router.replace(`/cards?${next.toString()}`)
    },
    [params, router],
  )

  const hasFilter =
    current.grade !== ALL ||
    current.type !== ALL ||
    current.season !== ALL ||
    current.keyword !== ''

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        className="relative"
        action={(formData) => {
          applyParam('keyword', String(formData.get('keyword') ?? ''))
        }}
      >
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          name="keyword"
          defaultValue={current.keyword}
          placeholder="이름 또는 도감번호"
          className="w-56 pl-8"
          aria-label="카드 검색"
        />
      </form>

      <Select value={current.grade} onValueChange={(value) => applyParam('grade', value)}>
        <SelectTrigger className="w-28" aria-label="등급 필터">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>전체 등급</SelectItem>
          {CARD_GRADES.map((grade) => (
            <SelectItem key={grade} value={grade}>
              {CARD_GRADE_META[grade].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={current.type} onValueChange={(value) => applyParam('type', value)}>
        <SelectTrigger className="w-32" aria-label="종류 필터">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>전체 종류</SelectItem>
          {CARD_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {CARD_TYPE_LABEL[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={current.season} onValueChange={(value) => applyParam('season', value)}>
        <SelectTrigger className="w-32" aria-label="시즌 필터">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>시즌 전체</SelectItem>
          <SelectItem value="true">시즌 카드</SelectItem>
          <SelectItem value="false">일반 카드</SelectItem>
        </SelectContent>
      </Select>

      {hasFilter && (
        <Button variant="ghost" size="sm" onClick={() => router.replace('/cards')}>
          <X className="size-4" />
          초기화
        </Button>
      )}
    </div>
  )
}
