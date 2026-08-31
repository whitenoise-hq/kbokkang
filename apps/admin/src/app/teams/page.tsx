import { ImageOff } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { TeamLogo } from '@/components/team-logo'
import { Card, CardContent } from '@/components/ui/card'
import { repositories } from '@/lib/repositories'
import { formatNumber } from '@/lib/format'
import { TeamEditDialog } from './_components/team-edit-dialog'

/**
 * 구단 관리 — 어드민 기획서 3.7.
 * KBO 10개 구단은 고정이라 생성/삭제 없이 수정만 제공한다.
 * 로고 등록 여부가 한눈에 보이도록 테이블 대신 격자로 배치한다.
 */
const TeamsPage = async () => {
  const teams = await repositories.teams.list()
  const withLogo = teams.filter((team) => team.logoUrl !== null).length

  return (
    <>
      <PageHeader
        title="구단 관리"
        description="로고·팀명·약칭·컬러를 관리합니다. 앱의 응원팀 선택에 그대로 쓰입니다"
      />

      <div
        className={
          withLogo === teams.length
            ? 'border-success/30 bg-success/5 flex items-center gap-3 rounded-xl border px-4 py-3'
            : 'border-warning/40 bg-warning/5 flex items-center gap-3 rounded-xl border px-4 py-3'
        }
      >
        <ImageOff
          className={withLogo === teams.length ? 'text-success size-4' : 'text-warning size-4'}
          aria-hidden
        />
        <p className="text-sm font-semibold">
          로고 등록 {formatNumber(withLogo)} / {formatNumber(teams.length)}
        </p>
        {withLogo < teams.length && (
          <p className="text-muted-foreground text-xs">미등록 구단은 팀 컬러 원형으로 표시됩니다</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {teams.map((team) => (
          <Card key={team.id} className="gap-0 py-5">
            <CardContent className="space-y-4 px-5">
              <div className="flex items-center gap-3">
                <div className="bg-muted grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border">
                  {team.logoUrl === null ? (
                    <TeamLogo team={team} size="md" />
                  ) : (
                    // Storage 연결 후 next/image 로 교체한다.
                    <img
                      src={team.logoUrl}
                      alt={team.name}
                      className="size-full object-contain p-1"
                    />
                  )}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-bold">{team.name}</p>
                  <p className="text-muted-foreground text-xs">
                    약칭 <span className="font-medium">{team.shortName}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t pt-3.5">
                <span
                  className="size-4 shrink-0 rounded border"
                  style={{ backgroundColor: team.color }}
                  aria-hidden
                />
                <span className="tabular text-muted-foreground font-mono text-xs">
                  {team.color}
                </span>
                {team.logoUrl === null && (
                  <span className="text-warning ml-auto text-[11px] font-medium">로고 없음</span>
                )}
              </div>

              <TeamEditDialog team={team} />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}

export default TeamsPage
