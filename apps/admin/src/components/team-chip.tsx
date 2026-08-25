import type { Team } from '@kbokkang/shared'
import { TeamLogo } from './team-logo'

/**
 * 구단 표기. 로고(없으면 팀 컬러 원형) + 짧은 이름.
 * 응원팀 미선택은 '미선택'.
 */
export const TeamChip = ({ team }: { team: Team | null | undefined }) => {
  if (team === null || team === undefined) {
    return <span className="text-muted-foreground text-sm">미선택</span>
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <TeamLogo team={team} size="sm" />
      {team.shortName}
    </span>
  )
}
