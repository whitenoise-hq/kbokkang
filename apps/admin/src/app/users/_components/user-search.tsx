'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/** 유저 닉네임 검색. 상태는 URL 쿼리로 유지한다. */
export const UserSearch = () => {
  const router = useRouter()
  const params = useSearchParams()
  const keyword = params.get('keyword') ?? ''

  return (
    <div className="bg-card shadow-card flex items-center gap-2 rounded-xl border p-3">
      <form
        className="relative"
        action={(formData) => {
          const next = String(formData.get('keyword') ?? '').trim()
          router.replace(next === '' ? '/users' : `/users?keyword=${encodeURIComponent(next)}`)
        }}
      >
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          name="keyword"
          defaultValue={keyword}
          placeholder="닉네임 검색"
          className="w-64 pl-8"
          aria-label="유저 검색"
        />
      </form>

      {keyword !== '' && (
        <Button variant="ghost" size="sm" onClick={() => router.replace('/users')}>
          <X className="size-4" />
          초기화
        </Button>
      )}
    </div>
  )
}
