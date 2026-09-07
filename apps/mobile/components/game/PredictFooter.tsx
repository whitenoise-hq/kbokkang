import { StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  canPredict,
  PREDICTION_PICK_LABEL,
  PREDICTION_RESULT_LABEL,
  type GamePhase,
} from '@kbokkang/shared'
import { COLORS, SPACING } from '@/theme/colors'
import { Text } from '@/components/ui/Text'
import { formatPoints } from '@/lib/format'
import type { GameView } from '@/types/game'

/**
 * 경기 카드 하단 — 예측 완료 / 결과 / 취소 안내.
 *
 * 팀 선택은 카드 본문의 세그먼트(`PickSegment`)가, **저장 버튼은 카드 헤더**가 맡는다.
 * 여기는 선택 이후의 **상태 문구**만 다룬다.
 *
 * ## 하단에 행을 늘리지 않는다
 *
 * 저장 버튼도 처음엔 여기 있었는데, 선택할 때마다 행이 생겨 **카드가 늘었다 줄었다** 했다.
 * 그래서 헤더의 남은 공간으로 옮겼다(`GameCard` 참고).
 *
 * 같은 이유로 **아무것도 안 고른 상태에서는 아무것도 렌더하지 않는다** — 셀 자체가 안내다.
 * 저장 전(`dirty`)에도 렌더하지 않는다: 헤더의 저장 버튼이 이미 상태를 말한다.
 *
 * 결과 표시에 **배지를 쓰지 않는다.** 세그먼트에서 적중한 칸이 이미 초록으로 채워지므로
 * 색 알약을 또 띄우면 강조가 두 번이다. `적중` + `+150P` 글자만 둔다(디자인 가이드 5장).
 *
 * ⚠️ 스코어 예측 **입력**은 다음 단계에서 붙인다. 지금은 입력된 스코어만 표시한다.
 *    승패 예측만으로도 유효하다(앱기획서 4장).
 */
export interface PredictFooterProps {
  readonly game: GameView
  readonly phase: GamePhase
  /** 저장하지 않은 선택이 있는지 — 있으면 헤더 버튼이 안내하므로 비워둔다 */
  readonly dirty: boolean
}

/** 정산 결과 → 글자색. 무효는 유저 탓이 아니므로 실패색을 쓰지 않는다. */
const RESULT_TONE = {
  pending: 'textAlt',
  win_hit: 'success',
  score_hit: 'success',
  miss: 'textAlt',
  void: 'warning',
} as const

export const PredictFooter = ({ game, phase, dirty }: PredictFooterProps) => {
  const { myPrediction } = game

  if (phase === 'cancelled') {
    return (
      <View style={styles.line}>
        <Text variant="caption" color="textAlt">
          경기가 취소되어 예측은 무효 처리됐습니다
        </Text>
      </View>
    )
  }

  if (canPredict(phase)) {
    // 저장 전이면 헤더의 저장 버튼이 안내를 맡는다 — 여기서 또 말하면 행이 하나 늘어난다
    if (dirty || myPrediction === null) return null

    return (
      <View style={styles.done}>
        <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
        <Text variant="caption" color="textAlt">
          예측 완료
        </Text>
      </View>
    )
  }

  if (myPrediction === null) {
    return (
      <View style={styles.line}>
        <Text variant="caption" color="textAlt">
          예측하지 않은 경기입니다
        </Text>
      </View>
    )
  }

  // 무승부는 팀 이름이 없으므로 라벨을 쓴다
  const pickedLabel =
    myPrediction.pickWinner === 'draw'
      ? PREDICTION_PICK_LABEL.draw
      : `${myPrediction.pickWinner === 'home' ? game.home.shortName : game.away.shortName} 승`
  const pickedScore =
    myPrediction.pickHomeScore === null || myPrediction.pickAwayScore === null
      ? null
      : `${String(myPrediction.pickAwayScore)} : ${String(myPrediction.pickHomeScore)}`

  return (
    <View style={styles.result}>
      <Text variant="caption" color="textAlt">
        내 예측{' '}
        <Text variant="caption" color="textNormal">
          {pickedLabel}
        </Text>
        {pickedScore === null ? '' : ` · ${pickedScore}`}
      </Text>

      <View style={styles.resultRight}>
        {myPrediction.result !== 'pending' && (
          <Text variant="body2" color={RESULT_TONE[myPrediction.result]}>
            {PREDICTION_RESULT_LABEL[myPrediction.result]}
          </Text>
        )}
        {myPrediction.earnedPoints !== null && myPrediction.earnedPoints > 0 && (
          <Text variant="body2" color="success">
            +{formatPoints(myPrediction.earnedPoints)}
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  line: { paddingTop: SPACING.sm + 2 },
  done: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingTop: SPACING.sm + 2,
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    paddingTop: SPACING.sm + 2,
  },
  resultRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
})
