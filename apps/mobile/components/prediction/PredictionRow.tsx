import { StyleSheet, View } from 'react-native'
import { isHit, type PredictionPick, type PredictionResult } from '@kbokkang/shared'
import { SPACING } from '@/theme/colors'
import { Text } from '@/components/ui/Text'
import { PickCell, type PickCellFill } from '@/components/game/PickCell'
import type { PredictionRowView } from '@/types/prediction'

/**
 * 예측 기록 한 줄 — 홈 경기 카드와 **같은 3열 그리드**(원정 / 스코어 / 홈). 그리고 끝이다.
 *
 * ## 두 번 걷어냈다
 *
 * 1. 처음엔 `두산 1 : 5 LG` 를 그냥 가로로 흘리고 아래에 "내 예측 LG 승" 을 붙였다.
 *    **팀명 길이가 달라 행마다 콜론 위치가 어긋나** 목록이 삐뚤빼뚤했고(두산 / KT / 삼성),
 *    "내 예측" 이 행마다 반복돼 시끄러웠다. 팀 이름도 한 행에 두 번 나왔다.
 * 2. 다음엔 우측에 결과 칸(`적중` / `+30P`)을 붙였는데, 칸 내용이 행마다 달라
 *    **오른쪽 끝이 다시 들쭉날쭉**했다. 획득 포인트는 **날짜 헤더에 하루 합계**로
 *    올려서(`PredictionDay`) 행에서 뺐다.
 * 3. 구단 컬러 마크도 뺐다. 채도 높은 원이 행마다 둘씩 있으면 목록이 알록달록해져
 *    정작 봐야 할 스코어와 적중 여부가 묻힌다. **홈 카드에는 마크를 남긴다** —
 *    거기서는 팀을 고르는 것이 핵심 행동이라 팀이 주인공이다.
 *
 * 그래서 남은 것은 세 칸뿐이고, 정보는 전부 **칸 배경색**이 말한다:
 *
 * - 적중 → `success` 채움 + 초록 글자
 * - 미적중 → `muted`(회색) 채움. 무엇을 골랐는지는 보이되 조용하다
 *   (실패를 빨강으로 강조하면 목록을 열 때마다 기분이 나빠진다)
 * - 무효 → 아무것도 채우지 않고 스코어 자리에 `취소`
 *
 * **무승부를 골랐으면 가운데 스코어 칸이 채워진다** — 홈 카드에서 무승부 칸이 곧
 * 스코어 자리인 것과 정확히 같다.
 *
 * 줄 구분은 부모의 divider 다 — 테두리를 쓰지 않는다(디자인 가이드 5장).
 */
export interface PredictionRowProps {
  readonly row: PredictionRowView
}

export const PredictionRow = ({ row }: PredictionRowProps) => {
  const hit = isHit(row.result)

  const fill = (side: PredictionPick): PickCellFill =>
    row.pickWinner === side ? fillOf(row.result) : 'none'
  const tone = (side: PredictionPick) =>
    row.pickWinner === side && hit ? 'success' : 'textNormal'

  return (
    <View style={styles.row}>
      <PickCell fill={fill('away')} align="start">
        <Text variant="button" color={tone('away')}>
          {row.away.shortName}
        </Text>
      </PickCell>

      <PickCell narrow fill={fill('draw')}>
        <ScoreSlot row={row} tone={tone('draw')} />
      </PickCell>

      <PickCell fill={fill('home')} align="end">
        <Text variant="button" color={tone('home')}>
          {row.home.shortName}
        </Text>
      </PickCell>
    </View>
  )
}

/**
 * 가운데 칸 — 스코어가 없으면 **이유를 쓴다.** 우측에 결과 칸이 따로 없으므로
 * 취소·집계중을 알릴 자리가 여기밖에 없다. 빈 칸으로 두면 데이터가 빠진 것처럼 보인다.
 */
const ScoreSlot = ({
  row,
  tone,
}: {
  readonly row: PredictionRowView
  readonly tone: 'success' | 'textNormal'
}) => {
  if (row.cancelled) {
    return (
      <Text variant="caption" color="textAlt">
        취소
      </Text>
    )
  }

  if (row.homeScore === null || row.awayScore === null) {
    return (
      <Text variant="caption" color="warning">
        집계중
      </Text>
    )
  }

  return (
    <Text variant="button" style={styles.score} color={tone}>
      {row.awayScore} : {row.homeScore}
    </Text>
  )
}

/**
 * 무효는 채우지 않는다 — 경기가 성립하지 않았으니 적중도 미적중도 아니다.
 * 정산 전(`pending`)은 회색으로 둔다: 내가 고른 칸은 보여야 하고, 결과가 아직 없다는
 * 것은 가운데 칸의 "집계중" 이 말한다.
 */
const fillOf = (result: PredictionResult): PickCellFill => {
  if (result === 'void') return 'none'
  return isHit(result) ? 'success' : 'muted'
}

const styles = StyleSheet.create({
  // 카드는 flush 라 좌우 여백을 행이 갖는다 — divider 가 카드 폭을 꽉 채워야 목록으로 읽힌다
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
  },
  // 숫자 자릿수가 바뀌어도 칸이 흔들리지 않게(디자인 가이드 2장)
  score: { fontVariant: ['tabular-nums'] },
})
