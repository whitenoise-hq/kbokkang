'use client'

import { useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { CARD_GRADE_META, type CardGrade } from '@kbokkang/shared'
import { Button } from '@/components/ui/button'

const MAX_BYTES = 5 * 1024 * 1024

/**
 * 카드 이미지 선택. 카드는 세로 비율(3:4) 통이미지 1장이다.
 * Storage 연결(4단계) 전이므로 지금은 data URL로 미리보기만 만들고 그대로 저장한다.
 */
export const ImagePicker = ({
  grade,
  value,
  onChange,
}: {
  grade: CardGrade
  value: string | null
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
      setError('5MB 이하 이미지만 올릴 수 있습니다')
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
        <div
          className="bg-muted relative aspect-[3/4] w-28 shrink-0 overflow-hidden rounded-lg border-2"
          style={{ borderColor: `${CARD_GRADE_META[grade].color}66` }}
        >
          {value === null ? (
            <div className="text-muted-foreground grid size-full place-items-center gap-1 text-center">
              <ImagePlus className="mx-auto size-5" aria-hidden />
            </div>
          ) : (
            // Storage 연결 후 next/image 로 교체한다.
            <img src={value} alt="카드 이미지 미리보기" className="size-full object-cover" />
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
              이미지 선택
            </Button>
            {value !== null && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
                <X className="size-4" />
                제거
              </Button>
            )}
          </div>

          <p className="text-muted-foreground text-xs leading-relaxed">
            세로 비율(3:4) 통이미지 1장 · 5MB 이하
            <br />
            카드 이름·도감번호는 이미지에 넣지 않습니다
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
    </div>
  )
}
