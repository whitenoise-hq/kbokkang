import type { Team } from '@kbokkang/shared'
import { cn } from '@/lib/utils'

/**
 * 구단 로고 슬롯.
 * teams.logo_url 이 채워지면 로고를 렌더하고, 없으면 팀 컬러 원형으로 대체한다.
 * 로고는 어드민 '구단 관리'에서 업로드해 DB(teams.logo_url)에 저장할 예정이며,
 * 그때 화면 수정 없이 이 컴포넌트가 자동으로 로고를 보여준다.
 *
 * Storage 연결 후 next/image 로 교체할 것(현재는 data URL 도 들어올 수 있어 img 사용).
 */
const SIZE_CLASS = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-9',
} as const

export const TeamLogo = ({
  team,
  size = 'md',
  className,
}: {
  team: Team | null | undefined
  size?: keyof typeof SIZE_CLASS
  className?: string
}) => {
  const box = SIZE_CLASS[size]

  if (team === null || team === undefined) {
    return <span className={cn(box, 'bg-muted shrink-0 rounded-full', className)} aria-hidden />
  }

  if (team.logoUrl === null) {
    return (
      <span
        className={cn(box, 'shrink-0 rounded-full', className)}
        style={{ backgroundColor: team.color }}
        aria-hidden
        title={team.name}
      />
    )
  }

  return (
    <img
      src={team.logoUrl}
      alt={team.name}
      className={cn(box, 'shrink-0 rounded-full object-contain', className)}
    />
  )
}
