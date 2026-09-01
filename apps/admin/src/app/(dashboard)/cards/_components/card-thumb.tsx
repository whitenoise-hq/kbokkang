import { ImageOff } from 'lucide-react'
import { CARD_GRADE_META, type CardGrade } from '@kbokkang/shared'
import { cn } from '@/lib/utils'

/**
 * 카드 썸네일. 통이미지 1장을 세로 비율(3:4)로 표시하고 등급색 테두리를 얹는다.
 * 이미지 미등록 카드가 있을 수 있으므로 폴백을 항상 둔다.
 *
 * imageUrl 은 Storage 공개 URL 이다. next/image 를 쓰려면 remotePatterns 설정이 필요해 img 를 쓴다.
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
    ) : (
      <img src={imageUrl} alt={name} className="size-full object-cover" loading="lazy" />
    )}
  </div>
)
