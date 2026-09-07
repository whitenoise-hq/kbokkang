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
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { formatTime } from '@/lib/format'
import type { GameView } from '@/types/game'
import { statusViewOf } from './game-status-view'
import { TeamMark } from './TeamMark'
import { PickCell } from './PickCell'
import { PickSegment } from './PickSegment'
import { PredictFooter } from './PredictFooter'

/**
 * 경기 카드 — 홈 화면의 핵심 단위(앱기획서 3.2).
 *
 * ## 선을 쓰지 않는다 (디자인 가이드 5장)
 *
 * 카드는 **그림자만**, 선택 영역은 `surface` 회색 한 덩어리 + divider, 선택은 **배경색**.
 * 처음엔 카드·칸·배지에 각각 테두리와 색을 뒀는데 "액자 안의 액자"가 되어
 * **정신사납고 정돈이 안 된** 느낌이 났다.
 *
 * 상태도 배지로 띄우지 않고 `18:30 · 5시간 남음` **한 줄**로 좌측에 모은다 —
 * 오른쪽 위에 색 알약이 떠 있으면 시각과 경쟁해 시선이 갈린다. 임박·집계중 같은
 * 강조는 **글자색**으로만 알린다.
 *
 * ## 저장 버튼은 헤더 우측에 (작게)
 *
 * 배지를 뺀 자리가 비어 있으므로 저장/변경 버튼을 **그 빈 공간**에 둔다. 카드 하단에
 * 두면 선택할 때마다 행이 하나 생겨 **카드가 늘었다 줄었다** 한다. 헤더에는
 * `minHeight` 를 버튼 높이(28)로 걸어 버튼이 나타나도 카드 높이가 그대로다.
 * 라벨도 "예측 저장" → **"저장"** 이다 — 카드 전체가 예측 UI 인데 버튼에 또 쓸 이유가 없다.
 *
 * ## 스코어 예측 입력은 없다 (보류)
 *
 * 승패 3택만 받는다. 스코어 입력 UI(바텀시트 + 스텝퍼)까지 만들어 봤지만 **걷어냈다** —
 * 야구 정확 스코어는 적중이 사실상 안 나서 150P 보상이 거의 발생하지 않는데, 시트
 * 애니메이션·스텝퍼·"승무패와 스코어가 충돌하면 무엇이 맞나" 규칙까지 복잡도가 컸다.
 * DB·정산·스키마는 그대로 있으니(`pick_home_score`, `score_hit`) 켤 때 UI 만 붙이면 된다.
 *
 * ## 3열 (원정 / 무승부 / 홈)
 *
 * **셀 자체가 팀이자 선택지다.** 팀 원 행과 "두산 승" 버튼 행을 따로 두면 같은 정보를
 * 두 번 쓰는 셈이라 카드가 길고 산만해진다.
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

/** 구단 컬러는 채도가 높아 크면 팀명보다 먼저 눈에 들어온다 */
const MARK_SIZE = 18

/** `Button` size="small" 높이. 헤더를 이 높이로 고정해 두면 버튼이 나타나도 안 밀린다 */
const SAVE_BUTTON_HEIGHT = 28

export const GameCard = ({ game, now, draftPick, saving, onSelect, onSave }: GameCardProps) => {
  const phase = gamePhaseOf(game, now)
  const remaining = remainingUntil(new Date(game.predictCloseAt), now)
  const status = statusViewOf(phase, remaining)

  const showScore = hasResult(phase) && game.homeScore !== null && game.awayScore !== null
  const outcome =
    game.homeScore !== null && game.awayScore !== null && showScore
      ? outcomeOf(game.homeScore, game.awayScore)
      : null

  const saved = game.myPrediction
  const selected = draftPick ?? saved?.pickWinner ?? null
  const dirty = draftPick !== null && draftPick !== (saved?.pickWinner ?? null)
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
  /** 결과가 있으면 결과가, 없으면 내 선택이 색으로 채워진다 */
  const filled = outcome ?? selected

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.when}>
          <Text variant="button">{formatTime(game.startAt)}</Text>
          <Text variant="body2" color="textDisabled">
            ·
          </Text>
          <Text variant="body2" color={status.tone}>
            {status.label}
          </Text>
        </View>

        {dirty && (
          <Button
            label={saved === null ? '저장' : '변경'}
            onPress={() => {
              onSave(game.id)
            }}
            size="small"
            loading={saving}
            pill
          />
        )}
      </View>

      <PickSegment
        filled={filled}
        away={
          <PickCell
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
              <Text variant="button" color={cellTone(selected === 'away', outcome === 'away')}>
                {game.away.shortName}
              </Text>
            </View>
          </PickCell>
        }
        draw={
          <PickCell
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
              <Text variant="caption" color={cellTone(selected === 'draw', outcome === 'draw')}>
                무승부
              </Text>
            )}
          </PickCell>
        }
        home={
          <PickCell
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
              <Text variant="button" color={cellTone(selected === 'home', outcome === 'home')}>
                {game.home.shortName}
              </Text>
            </View>
          </PickCell>
        }
      />

      <PredictFooter game={game} phase={phase} dirty={dirty} />
    </Card>
  )
}

/** 채워진 칸은 글자색까지 바꿔야 배경 틴트만으로 부족한 대비를 보완한다 */
const cellTone = (selected: boolean, won: boolean) =>
  won ? 'success' : selected ? 'primary' : 'textStrong'

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // 저장 버튼이 나타나도 카드 높이가 변하지 않도록 헤더 높이를 버튼 높이로 고정한다
    minHeight: SAVE_BUTTON_HEIGHT,
    marginBottom: SPACING.sm + 2,
  },
  when: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs + 2 },
  team: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm + 2 },
  // 홈은 거울 배치 — 마크가 오른쪽에 온다
  teamHome: { flexDirection: 'row-reverse' },
  // 숫자 자릿수가 바뀌어도 흔들리지 않게(디자인 가이드 2장 tabular-nums)
  score: { fontVariant: ['tabular-nums'], color: COLORS.textStrong },
})
