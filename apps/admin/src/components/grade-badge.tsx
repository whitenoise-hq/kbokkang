import { CARD_GRADE_META, type CardGrade } from '@kbokkang/shared'
import { cn } from '@/lib/utils'

/**
 * 등급 배지. 색은 @kbokkang/shared 의 CARD_GRADE_META 를 그대로 쓴다.
 * 등급색은 카드·등급 표시 전용이므로 일반 UI에는 쓰지 않는다(디자인 가이드 1장).
 */
export const GradeBadge = ({
  grade,
  showDexPrefix = false,
  className,
}: {
  grade: CardGrade
  showDexPrefix?: boolean
  className?: string
}) => {
  const meta = CARD_GRADE_META[grade]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold',
        className,
      )}
      style={{ color: meta.color, backgroundColor: `${meta.color}1A` }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {showDexPrefix ? `${meta.prefix} ${meta.label}` : meta.label}
    </span>
  )
}

/** 풀아트/박스형 표기 */
export const LayoutLabel = ({ grade }: { grade: CardGrade }) => (
  <span className="text-muted-foreground text-xs">
    {CARD_GRADE_META[grade].layout === 'full_art' ? '풀아트' : '박스형'}
  </span>
)
