'use client'

import { useCallback, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ImagePlus, Trash2, TriangleAlert, Upload } from 'lucide-react'
import { toast } from 'sonner'
import {
  CARD_GRADES,
  CARD_GRADE_META,
  CARD_TYPES,
  CARD_TYPE_LABEL,
  formatDexNo,
  type CardGrade,
  type CardType,
} from '@kbokkang/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { EmptyState } from '@/components/empty-state'
import { cn } from '@/lib/utils'
import { createCardsBulk } from '../../actions'

const MAX_BYTES = 5 * 1024 * 1024
const MAX_FILES = 50

interface Draft {
  readonly key: string
  readonly fileName: string
  readonly dataUrl: string
  readonly name: string
  readonly grade: CardGrade
  readonly type: CardType
}

/** 파일명에서 카드 이름 후보 추출 — 확장자와 앞쪽 번호 접두어 제거 */
const nameFromFile = (fileName: string): string =>
  fileName
    .replace(/\.[^.]+$/, '')
    .replace(/^[\d\-_.\s]+/, '')
    .replaceAll('_', ' ')
    .trim()

/**
 * 카드 이미지 일괄 업로드.
 * 목표 150장을 1장씩 등록하는 부담을 줄인다. 도감번호는 저장 시 서버가 순서대로 부여한다.
 */
export const BulkUploader = ({ countByGrade }: { countByGrade: Record<CardGrade, number> }) => {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const keySeq = useRef(0)
  const [pending, startTransition] = useTransition()

  const [drafts, setDrafts] = useState<readonly Draft[]>([])
  const [dragging, setDragging] = useState(false)
  const [rejected, setRejected] = useState<readonly string[]>([])

  /** 일괄 지정용 기본값 — 이후 개별 수정 가능 */
  const [defaultGrade, setDefaultGrade] = useState<CardGrade>('normal')
  const [defaultType, setDefaultType] = useState<CardType>('item')

  const addFiles = useCallback(
    (fileList: FileList | null) => {
      if (fileList === null) return

      const files = Array.from(fileList)
      const skipped: string[] = []

      const accepted = files.filter((file) => {
        if (!file.type.startsWith('image/')) {
          skipped.push(`${file.name} — 이미지 아님`)
          return false
        }
        if (file.size > MAX_BYTES) {
          skipped.push(`${file.name} — 5MB 초과`)
          return false
        }
        return true
      })

      setRejected(skipped)

      const room = MAX_FILES - drafts.length
      if (room <= 0) {
        toast.error(`한 번에 ${MAX_FILES}장까지만 올릴 수 있습니다`)
        return
      }

      accepted.slice(0, room).forEach((file) => {
        // FileReader 완료 순서가 비결정적이므로 key는 단조 증가 카운터로 만든다.
        keySeq.current += 1
        const key = `draft-${String(keySeq.current)}`

        const reader = new FileReader()
        reader.onload = () => {
          if (typeof reader.result !== 'string') return

          setDrafts((prev) => [
            ...prev,
            {
              key,
              fileName: file.name,
              dataUrl: reader.result as string,
              name: nameFromFile(file.name),
              grade: defaultGrade,
              type: defaultType,
            },
          ])
        }
        reader.onerror = () => toast.error(`${file.name} 을 읽지 못했습니다`)
        reader.readAsDataURL(file)
      })
    },
    [defaultGrade, defaultType, drafts.length],
  )

  const patchDraft = (key: string, patch: Partial<Draft>) => {
    setDrafts((prev) => prev.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)))
  }

  const removeDraft = (key: string) => {
    setDrafts((prev) => prev.filter((draft) => draft.key !== key))
  }

  const applyDefaults = () => {
    setDrafts((prev) => prev.map((draft) => ({ ...draft, grade: defaultGrade, type: defaultType })))
    toast.success('선택한 등급·종류를 전체에 적용했습니다')
  }

  /** 등급별로 몇 번부터 부여되는지 미리보기 */
  const previewDexNos = (): ReadonlyMap<string, string> => {
    const seqByGrade = new Map<CardGrade, number>(
      CARD_GRADES.map((grade) => [grade, countByGrade[grade]]),
    )

    return new Map(
      drafts.map((draft) => {
        const next = (seqByGrade.get(draft.grade) ?? 0) + 1
        seqByGrade.set(draft.grade, next)
        return [draft.key, formatDexNo({ grade: draft.grade, seq: next })]
      }),
    )
  }

  const dexNoByKey = previewDexNos()
  const invalidCount = drafts.filter((draft) => draft.name.trim() === '').length

  const submit = () => {
    startTransition(async () => {
      const result = await createCardsBulk(
        drafts.map((draft) => ({
          name: draft.name,
          grade: draft.grade,
          type: draft.type,
          imageUrl: draft.dataUrl,
          drawWeight: 1,
          isSeason: false,
        })),
      )

      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      router.push('/cards')
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">일괄 기본값</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="defaultGrade">등급</Label>
            <Select
              value={defaultGrade}
              onValueChange={(value) => setDefaultGrade(value as CardGrade)}
            >
              <SelectTrigger id="defaultGrade" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARD_GRADES.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {CARD_GRADE_META[grade].label} ({CARD_GRADE_META[grade].prefix})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultType">종류</Label>
            <Select
              value={defaultType}
              onValueChange={(value) => setDefaultType(value as CardType)}
            >
              <SelectTrigger id="defaultType" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARD_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {CARD_TYPE_LABEL[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={applyDefaults} disabled={drafts.length === 0}>
            전체에 적용
          </Button>

          <p className="text-muted-foreground ml-auto text-xs leading-relaxed">
            새로 추가하는 파일에 이 값이 기본 적용됩니다
            <br />
            개별 항목은 아래 목록에서 바꿀 수 있습니다
          </p>
        </CardContent>
      </Card>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          addFiles(event.dataTransfer.files)
        }}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-12 transition-colors',
          dragging
            ? 'border-primary bg-accent'
            : 'bg-card hover:border-muted-foreground/40 hover:bg-muted/60 border-border',
        )}
      >
        <span
          className={cn(
            'grid size-11 place-items-center rounded-full transition-colors',
            dragging ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          <ImagePlus className="size-5" aria-hidden />
        </span>
        <p className="mt-1 text-sm font-medium">
          {dragging ? '여기에 놓으세요' : '이미지를 끌어다 놓거나 클릭해서 선택'}
        </p>
        <p className="text-muted-foreground text-xs">
          세로 비율(3:4) 통이미지 · 5MB 이하 · 한 번에 최대 {MAX_FILES}장
        </p>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => addFiles(event.target.files)}
      />

      {rejected.length > 0 && (
        <div className="border-destructive/30 bg-destructive/5 space-y-1 rounded-lg border px-4 py-3">
          <p className="text-destructive flex items-center gap-1.5 text-xs font-semibold">
            <TriangleAlert className="size-3.5" />
            제외된 파일 {rejected.length}개
          </p>
          {rejected.map((line) => (
            <p key={line} className="text-muted-foreground text-xs">
              {line}
            </p>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">
            등록 대기 {drafts.length > 0 && `${drafts.length}장`}
          </CardTitle>
          {drafts.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setDrafts([])}>
              전체 비우기
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {drafts.length === 0 ? (
            <EmptyState
              icon={Upload}
              title="선택된 이미지가 없습니다"
              description="위 영역에 카드 이미지를 끌어다 놓아 주세요"
            />
          ) : (
            <div className="space-y-2">
              {drafts.map((draft) => (
                <div
                  key={draft.key}
                  className="flex flex-wrap items-center gap-3 rounded-lg border p-2.5"
                >
                  <div
                    className="aspect-[3/4] w-10 shrink-0 overflow-hidden rounded border-2"
                    style={{ borderColor: `${CARD_GRADE_META[draft.grade].color}66` }}
                  >
                    <img src={draft.dataUrl} alt={draft.name} className="size-full object-cover" />
                  </div>

                  <span className="tabular w-14 shrink-0 font-mono text-xs font-semibold">
                    {dexNoByKey.get(draft.key)}
                  </span>

                  <Input
                    value={draft.name}
                    onChange={(event) => patchDraft(draft.key, { name: event.target.value })}
                    placeholder="카드 이름"
                    className={cn('h-8 w-44', draft.name.trim() === '' && 'border-destructive')}
                    aria-label={`${draft.fileName} 카드 이름`}
                  />

                  <Select
                    value={draft.grade}
                    onValueChange={(value) => patchDraft(draft.key, { grade: value as CardGrade })}
                  >
                    <SelectTrigger className="h-8 w-28" aria-label="등급">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CARD_GRADES.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {CARD_GRADE_META[grade].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={draft.type}
                    onValueChange={(value) => patchDraft(draft.key, { type: value as CardType })}
                  >
                    <SelectTrigger className="h-8 w-28" aria-label="종류">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CARD_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {CARD_TYPE_LABEL[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <GradeBadge grade={draft.grade} />

                  <span className="text-muted-foreground truncate text-xs" title={draft.fileName}>
                    {draft.fileName}
                  </span>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto size-8"
                    onClick={() => removeDraft(draft.key)}
                    aria-label={`${draft.fileName} 제외`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {drafts.length > 0 && (
        <div className="bg-card/90 sticky bottom-0 flex items-center justify-between gap-4 rounded-xl border px-4 py-3 backdrop-blur">
          <div className="text-xs">
            {invalidCount > 0 ? (
              <p className="text-destructive flex items-center gap-1.5 font-medium">
                <TriangleAlert className="size-3.5" />
                이름이 비어 있는 카드 {invalidCount}장을 채워 주세요
              </p>
            ) : (
              <p className="text-success flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="size-3.5" />
                {drafts.length}장 등록 준비 완료
              </p>
            )}
          </div>

          <Button onClick={submit} disabled={pending || invalidCount > 0}>
            {pending ? '등록 중…' : `${drafts.length}장 등록`}
          </Button>
        </div>
      )}
    </div>
  )
}
