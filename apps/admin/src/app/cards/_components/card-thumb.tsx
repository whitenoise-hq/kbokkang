import { ImageOff } from 'lucide-react'
import { CARD_GRADE_META, type CardGrade } from '@kbokkang/shared'
import { cn } from '@/lib/utils'

/**
 * 카드 썸네일. 통이미지 1장을 세로 비율(3:4)로 표시하고 등급색 테두리를 얹는다.
 * 이미지 미등록 카드가 있을 수 있으므로 폴백을 항상 둔다.
 */
export const CardThumb = ({
  imageUrl,
  grade,
  name,
  className,
}: {
  imageUrl: string | null
  grade: CardGrade
  name: string
  className?: string
}) => (
  <div
    className={cn(
      'bg-muted relative aspect-[3/4] w-11 shrink-0 overflow-hidden rounded-md border-2',
      className,
    )}
    style={{ borderColor: `${CARD_GRADE_META[grade].color}66` }}
  >
    {imageUrl === null ? (
      <div className="text-muted-foreground grid size-full place-items-center" title="이미지 없음">
        <ImageOff className="size-3.5" aria-label={`${name} 이미지 없음`} />
      </div>
    ) : imageUrl.startsWith('data:') ? (
      // 어드민에서 방금 올린 이미지. Storage 연결 후 next/image 로 교체한다.
      <img src={imageUrl} alt={name} className="size-full object-cover" />
    ) : (
      // fixture 카드는 실제 파일이 없어 등급색 플레이스홀더로 대체한다.
      <div
        className="size-full"
        style={{
          background: `linear-gradient(145deg, ${CARD_GRADE_META[grade].color}40, ${CARD_GRADE_META[grade].color}0D)`,
        }}
        aria-label={name}
      />
    )}
  </div>
)
