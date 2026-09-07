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
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatPoints } from '@/lib/format'
import type { GameView } from '@/types/game'

/**
 * 경기 카드 하단 — 저장 버튼 / 예측 완료 / 결과 / 취소 안내.
 *
 * 팀 선택은 카드 본문의 2열 셀(`TeamPickCell`)이 담당한다. 여기는 **선택 이후**만 다룬다.
 *
 * ## 저장은 명시적이다 (경기 카드마다)
 *
 * 승패를 고르는 것만으로 저장하지 않는다 — 선택할 때마다 서버 요청이 나가면 낭비다.
 * **고른 값이 저장된 값과 다를 때만 저장 버튼이 나타난다.**
 *
 * 화면 하단에 저장 버튼 하나를 두고 일괄 저장하는 방법도 있었지만 택하지 않았다:
 * **경기마다 마감 시각이 다르다**(일요일은 14:00·17:00 이 섞인다). 일괄 저장이면 고르는
 * 동안 일부가 마감될 수 있고, 저장 전에 앱을 닫으면 선택이 사라진다.
 *
 * 아무것도 안 고른 상태에서는 아무것도 렌더하지 않는다 — 셀 자체가 안내다.
 * 안내 문구를 넣었더니 행이 하나 더 생겨 카드가 세로로 길어졌다.
 *
 * ⚠️ 스코어 예측 **입력**은 다음 단계에서 붙인다. 지금은 입력된 스코어만 표시한다.
 *    승패 예측만으로도 유효하다(앱기획서 4장).
 */
export interface PredictFooterProps {
  readonly game: GameView
  readonly phase: GamePhase
  /** 저장하지 않은 선택이 있는지 */
  readonly dirty: boolean
  readonly saving: boolean
  readonly onSave: () => void
}

/** 정산 결과 → 배지 색. 무효는 유저 탓이 아니므로 실패색을 쓰지 않는다. */
const RESULT_TONE = {
  pending: 'textAlt',
  win_hit: 'success',
  score_hit: 'success',
  miss: 'textAlt',
  void: 'warning',
} as const

export const PredictFooter = ({ game, phase, dirty, saving, onSave }: PredictFooterProps) => {
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
    if (dirty) {
      return (
        <View style={styles.save}>
          <Button
            label={myPrediction === null ? '예측 저장' : '예측 변경'}
            onPress={onSave}
            loading={saving}
            compact
          />
        </View>
      )
    }

    if (myPrediction === null) return null

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
          <Badge
            label={PREDICTION_RESULT_LABEL[myPrediction.result]}
            tone={RESULT_TONE[myPrediction.result]}
          />
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
  save: { paddingTop: SPACING.sm + 2 },
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
