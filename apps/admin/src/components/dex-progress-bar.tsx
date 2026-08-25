import { CARD_GRADE_META, type CardGrade } from '@kbokkang/shared'
import { toPercent } from '@/lib/format'

/** 도감 진행률 바. 등급별 색으로 표시한다. */
export const DexProgressBar = ({
  grade,
  owned,
  total,
}: {
  grade: CardGrade
  owned: number
  total: number
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-xs">
      <span className="font-medium" style={{ color: CARD_GRADE_META[grade].color }}>
        {CARD_GRADE_META[grade].label}
      </span>
      <span className="tabular text-muted-foreground">
        {owned} / {total}
      </span>
    </div>
    <div className="bg-muted h-1.5 overflow-hidden rounded-full">
      <div
        className="h-full rounded-full transition-[width]"
        style={{
          width: `${toPercent(owned, total)}%`,
          backgroundColor: CARD_GRADE_META[grade].color,
        }}
      />
    </div>
  </div>
)
