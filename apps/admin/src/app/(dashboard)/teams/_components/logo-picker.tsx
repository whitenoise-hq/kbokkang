'use client'

import { useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MAX_BYTES = 1024 * 1024

/**
 * 구단 로고 선택. 카드 이미지(3:4)와 달리 정사각 비율이라 별도 컴포넌트로 둔다.
 * Storage 연결(4단계) 전이므로 지금은 data URL로 미리보기만 만들고 그대로 저장한다.
 */
export const LogoPicker = ({
  value,
  color,
  onChange,
}: {
  value: string | null
  /** 로고 미등록 시 대체 표시할 팀 컬러 */
  color: string
  onChange: (next: string | null) => void
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = (file: File | undefined) => {
    if (file === undefined) return

    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 올릴 수 있습니다')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('1MB 이하 이미지만 올릴 수 있습니다')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setError(null)
      onChange(typeof reader.result === 'string' ? reader.result : null)
    }
    reader.onerror = () => setError('이미지를 읽지 못했습니다')
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-4">
        <div className="bg-muted grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border">
          {value === null ? (
            <span
              className="size-10 rounded-full"
              style={{ backgroundColor: color }}
              aria-label="로고 미등록 — 팀 컬러로 표시됩니다"
            />
          ) : (
            // Storage 연결 후 next/image 로 교체한다.
            <img src={value} alt="로고 미리보기" className="size-full object-contain p-1.5" />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              로고 선택
            </Button>
            {value !== null && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
                <X className="size-4" />
                제거
              </Button>
            )}
          </div>

          <p className="text-muted-foreground text-xs leading-relaxed">
            정사각 비율 권장 · 1MB 이하 · 배경 투명 PNG
            <br />
            미등록이면 팀 컬러 원형으로 표시됩니다
          </p>

          {error !== null && <p className="text-destructive text-xs">{error}</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      {value === null && (
        <p className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
          <ImagePlus className="size-3" aria-hidden />
          로고를 등록하면 대시보드·경기 관리·유저 관리에 함께 표시됩니다
        </p>
      )}
    </div>
  )
}
