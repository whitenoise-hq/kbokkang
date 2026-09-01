'use client'

import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { CARD_GRADE_META, type CardGrade } from '@kbokkang/shared'
import { Button } from '@/components/ui/button'
import {
  CARD_IMAGE_OPTIONS,
  compressImage,
  compressionRatio,
  formatBytes,
  type CompressedImage,
} from '@/lib/image/compress'
import { uploadCardImage } from '@/lib/storage/actions'

/**
 * 카드 이미지 선택 → 압축 → Storage 업로드.
 *
 * 카드는 세로 비율(3:4) 통이미지 1장이다.
 * 원본을 그대로 올리지 않는다 — Supabase 이미지 변환은 Pro 전용이고, 카드 150장 원본이면
 * Free Storage 1GB 의 절반을 넘긴다(compress.ts 주석 참조).
 *
 * value 는 업로드된 **공개 URL**이며 그대로 cards.image_url 에 저장된다.
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
  const [busy, setBusy] = useState(false)
  const [compressed, setCompressed] = useState<CompressedImage | null>(null)

  // object URL 은 직접 해제해야 메모리에 남지 않는다
  useEffect(
    () => () => {
      if (compressed !== null) URL.revokeObjectURL(compressed.previewUrl)
    },
    [compressed],
  )

  const handleFile = async (file: File | undefined) => {
    if (file === undefined) return

    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 올릴 수 있습니다')
      return
    }

    setError(null)
    setBusy(true)

    try {
      const result = await compressImage(file, CARD_IMAGE_OPTIONS)
      setCompressed(result)

      const formData = new FormData()
      formData.append('file', new File([result.blob], 'card.webp', { type: result.blob.type }))

      const uploaded = await uploadCardImage(formData)
      if (!uploaded.ok || uploaded.url === undefined) {
        setError(uploaded.message)
        return
      }

      onChange(uploaded.url)
    } catch (cause) {
      console.error('카드 이미지 처리 실패:', cause)
      setError(cause instanceof Error ? cause.message : '이미지 처리에 실패했습니다')
    } finally {
      setBusy(false)
    }
  }

  const preview = compressed?.previewUrl ?? value

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-4">
        <div
          className="bg-muted relative aspect-[3/4] w-28 shrink-0 overflow-hidden rounded-lg border-2"
          style={{ borderColor: `${CARD_GRADE_META[grade].color}66` }}
        >
          {busy ? (
            <div className="text-muted-foreground grid size-full place-items-center">
              <Loader2 className="size-5 animate-spin" aria-label="처리 중" />
            </div>
          ) : preview === null ? (
            <div className="text-muted-foreground grid size-full place-items-center">
              <ImagePlus className="size-5" aria-hidden />
            </div>
          ) : (
            // Storage 공개 URL. next/image 를 쓰려면 remotePatterns 설정이 필요해 img 를 쓴다
            <img src={preview} alt="카드 이미지 미리보기" className="size-full object-cover" />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? '처리 중…' : '이미지 선택'}
            </Button>
            {value !== null && !busy && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCompressed(null)
                  onChange(null)
                }}
              >
                <X className="size-4" />
                제거
              </Button>
            )}
          </div>

          <p className="text-muted-foreground text-xs leading-relaxed">
            세로 비율(3:4) 통이미지 · 자동으로 긴 변 {CARD_IMAGE_OPTIONS.maxEdge}px WebP 로 압축
            <br />
            카드 이름·도감번호는 이미지에 넣지 않습니다
          </p>

          {compressed !== null && (
            <p className="text-success text-xs">
              {formatBytes(compressed.originalBytes)} → {formatBytes(compressed.compressedBytes)} (
              {compressionRatio(compressed).toFixed(0)}% 감소) · {compressed.width}×
              {compressed.height}
            </p>
          )}

          {error !== null && <p className="text-destructive text-xs">{error}</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0])
          // 같은 파일을 다시 선택할 수 있게 비운다(파라미터 변형을 피해 ref 로 처리)
          if (inputRef.current !== null) inputRef.current.value = ''
        }}
      />
    </div>
  )
}
