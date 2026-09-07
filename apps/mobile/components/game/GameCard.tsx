import { StyleSheet, View } from 'react-native'
import {
  canPredict,
  gamePhaseOf,
  hasResult,
  outcomeOf,
  remainingUntil,
  type PredictionPick,
} from '@kbokkang/shared'
import { COLORS, SPACING } from '@/theme/colors'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Text } from '@/components/ui/Text'
import { formatTime } from '@/lib/format'
import type { GameView } from '@/types/game'
import { statusViewOf } from './game-status-view'
import { TeamMark } from './TeamMark'
import { PickCell } from './PickCell'
import { PredictFooter } from './PredictFooter'

/**
 * 경기 카드 — 홈 화면의 핵심 단위(앱기획서 3.2).
 *
 * ## 3열 구조 (원정 / 무승부 / 홈)
 *
 * **셀 자체가 팀이자 선택지다.** 처음엔 팀 원을 보여주는 행과 "두산 승" 버튼 행을 따로
 * 뒀는데 같은 정보를 두 번 쓰는 셈이라 카드가 길고 산만했다.
 *
 * - 팀 칸: 마크와 이름을 **가로**로 두고 좌우를 거울처럼 배치한다(원정은 마크가 왼쪽).
 *   내용은 **바깥쪽 끝에 붙인다** — 가운데 정렬하면 세 칸이 안쪽으로 뭉쳐 보인다.
 * - 무승부 칸: **좁게**(고정 폭) + 작은 글씨. 팀 칸과 같은 폭이면 가운데가 과해 보인다.
 * - **정산 후에는 무승부 칸에 스코어가 들어간다.** 이때 "무승부" 글자는 실제로 무승부일
 *   때만 남긴다 — 홈/원정이 이긴 경기에 "무승부"가 붙어 있으면 결과를 잘못 읽는다.
 *
 * KBO 는 무승부가 실제로 있으므로(실측 3:3, 0:0) 선택지로 준다 — 없으면 무승부 경기에서
 * 모든 유저가 아무 이유 없이 손해를 본다.
 *
 * 팀 원 안에는 약칭을 넣지 않고(`showLabel={false}`) 옆에 이름을 쓴다 — 둘 다 하면
 * 같은 글자가 두 번 나온다. 로고가 확정되면 원 자리에 이미지가 들어간다.
 *
 * `now` 를 props 로 받는다 — 카드마다 시계를 만들면 리렌더가 어긋난다.
 * 화면이 `useServerNow()` 로 한 번 받아 모든 카드에 내려준다.
 */
export interface GameCardProps {
  readonly game: GameView
  readonly now: Date
  /** 저장하지 않은 선택. 없으면 저장된 값을 쓴다 */
  readonly draftPick: PredictionPick | null
  readonly saving: boolean
  readonly onSelect: (gameId: string, pick: PredictionPick) => void
  readonly onSave: (gameId: string) => void
}

const MARK_SIZE = 24

export const GameCard = ({ game, now, draftPick, saving, onSelect, onSave }: GameCardProps) => {
  const phase = gamePhaseOf(game, now)
  const remaining = remainingUntil(new Date(game.predictCloseAt), now)
  const status = statusViewOf(phase, remaining)

  const showScore = hasResult(phase) && game.homeScore !== null && game.awayScore !== null
  const outcome =
    game.homeScore !== null && game.awayScore !== null && showScore
      ? outcomeOf(game.homeScore, game.awayScore)
      : null

  const savedPick = game.myPrediction?.pickWinner ?? null
  const selected = draftPick ?? savedPick
  const dirty = draftPick !== null && draftPick !== savedPick
  const selectable = canPredict(phase)

  const pressHandler = (pick: PredictionPick): { onPress?: () => void } =>
    selectable
      ? {
          onPress: () => {
            onSelect(game.id, pick)
          },
        }
      : {}

  /** 결과가 나온 뒤에는 실제 무승부일 때만 "무승부" 를 남긴다 */
  const showDrawLabel = !showScore || outcome === 'draw'

  return (
    <Card>
      <View style={styles.header}>
        <Text variant="button">{formatTime(game.startAt)}</Text>
        <Badge label={status.label} tone={status.tone} />
      </View>

      <View style={styles.cells}>
        <PickCell
          position="left"
          align="start"
          selected={selected === 'away'}
          won={outcome === 'away'}
          {...pressHandler('away')}
        >
          <View style={styles.team}>
            <TeamMark
              shortName={game.away.shortName}
              color={game.away.color}
              size={MARK_SIZE}
              showLabel={false}
            />
            <Text variant="button" color={selected === 'away' ? 'primary' : 'textStrong'}>
              {game.away.shortName}
            </Text>
          </View>
        </PickCell>

        <PickCell
          position="middle"
          narrow
          selected={selected === 'draw'}
          won={outcome === 'draw'}
          {...pressHandler('draw')}
        >
          {showScore && (
            <Text variant="button" style={styles.score}>
              {game.awayScore} : {game.homeScore}
            </Text>
          )}
          {showDrawLabel && (
            <Text variant="caption" color={selected === 'draw' ? 'primary' : 'textAlt'}>
              무승부
            </Text>
          )}
        </PickCell>

        <PickCell
          position="right"
          align="end"
          selected={selected === 'home'}
          won={outcome === 'home'}
          {...pressHandler('home')}
        >
          <View style={[styles.team, styles.teamHome]}>
            <TeamMark
              shortName={game.home.shortName}
              color={game.home.color}
              size={MARK_SIZE}
              showLabel={false}
            />
            <Text variant="button" color={selected === 'home' ? 'primary' : 'textStrong'}>
              {game.home.shortName}
            </Text>
          </View>
        </PickCell>
      </View>

      <PredictFooter
        game={game}
        phase={phase}
        dirty={dirty}
        saving={saving}
        onSave={() => {
          onSave(game.id)
        }}
      />
    </Card>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm + 2,
  },
  cells: { flexDirection: 'row' },
  team: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm + 2 },
  // 홈은 거울 배치 — 마크가 오른쪽에 온다
  teamHome: { flexDirection: 'row-reverse' },
  // 숫자 자릿수가 바뀌어도 흔들리지 않게(디자인 가이드 2장 tabular-nums)
  score: { fontVariant: ['tabular-nums'], color: COLORS.textStrong },
})
