'use client'

import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  TEAM_LOGO_OPTIONS,
  compressImage,
  compressionRatio,
  formatBytes,
  type CompressedImage,
} from '@/lib/image/compress'
import { uploadTeamLogo } from '@/lib/storage/actions'

/**
 * 구단 로고 선택 → 압축 → Storage 업로드.
 * 카드 이미지(3:4)와 달리 정사각 비율이라 별도 컴포넌트로 둔다.
 *
 * value 는 업로드된 **공개 URL**이며 그대로 teams.logo_url 에 저장된다.
 */
export const LogoPicker = ({
  teamId,
  value,
  color,
  onChange,
}: {
  teamId: number
  value: string | null
  /** 로고 미등록 시 대체 표시할 팀 컬러 */
  color: string
  onChange: (next: string | null) => void
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [compressed, setCompressed] = useState<CompressedImage | null>(null)

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
      const result = await compressImage(file, TEAM_LOGO_OPTIONS)
      setCompressed(result)

      const formData = new FormData()
      formData.append('file', new File([result.blob], 'logo.webp', { type: result.blob.type }))
      formData.append('teamId', String(teamId))

      const uploaded = await uploadTeamLogo(formData)
      if (!uploaded.ok || uploaded.url === undefined) {
        setError(uploaded.message)
        return
      }

      onChange(uploaded.url)
    } catch (cause) {
      console.error('구단 로고 처리 실패:', cause)
      setError(cause instanceof Error ? cause.message : '이미지 처리에 실패했습니다')
    } finally {
      setBusy(false)
    }
  }

  const preview = compressed?.previewUrl ?? value

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-4">
        <div className="bg-muted grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border">
          {busy ? (
            <Loader2 className="text-muted-foreground size-5 animate-spin" aria-label="처리 중" />
          ) : preview === null ? (
            <span
              className="size-10 rounded-full"
              style={{ backgroundColor: color }}
              aria-label="로고 미등록 — 팀 컬러로 표시됩니다"
            />
          ) : (
            <img src={preview} alt="로고 미리보기" className="size-full object-contain p-1.5" />
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
              {busy ? '처리 중…' : '로고 선택'}
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
            정사각 비율 권장 · 자동으로 {TEAM_LOGO_OPTIONS.maxEdge}px WebP 로 압축
            <br />
            미등록이면 팀 컬러 원형으로 표시됩니다
          </p>

          {compressed !== null && (
            <p className="text-success text-xs">
              {formatBytes(compressed.originalBytes)} → {formatBytes(compressed.compressedBytes)} (
              {compressionRatio(compressed).toFixed(0)}% 감소)
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

      {value === null && !busy && (
        <p className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
          <ImagePlus className="size-3" aria-hidden />
          로고를 등록하면 대시보드·경기 관리·유저 관리에 함께 표시됩니다
        </p>
      )}
    </div>
  )
}
