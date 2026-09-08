import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { CARD_GRADES, CARD_GRADE_META, DRAW_GRADE_RATES, type DrawType } from '@kbokkang/shared'
import { COLORS, SECTION_GAP, SPACING } from '@/theme/colors'
import { Card } from '@/components/ui/Card'
import { Screen } from '@/components/ui/Screen'
import { Text } from '@/components/ui/Text'
import { PackCard } from '@/components/draw/PackCard'
import { formatPoints } from '@/lib/format'
import { MOCK_POINTS } from '@/mocks/draw'

/**
 * 뽑기 — 팩 선택(앱기획서 3.3).
 *
 * 이 화면이 하는 일은 **둘뿐이다**: 보유 포인트를 보여주고, 일반/프리미엄 중 하나를 고른다.
 * 팩을 누르면 **개봉 전체화면**(`/pack/[type]`)으로 간다 — 장수 선택과 개봉 연출은 거기서
 * 한다. 탭 바가 보이는 화면에서 개봉하면 연출에 집중되지 않는다.
 *
 * 보유 포인트는 카드에 넣지 않고 상단에 `display`(32)로 그냥 쓴다(가이드 7.1 ①).
 * 이 화면의 주인공은 팩이라 포인트까지 카드로 감싸면 카드가 세 개가 된다.
 *
 * 등급 확률은 **접었다 펴는 표**로 화면 안에서 끝낸다. 시트로 띄우면 확률을 보려고
 * 화면을 벗어나야 하는데, 확률형 콘텐츠는 고르기 직전에 바로 확인할 수 있어야 한다.
 *
 * ⚠️ 지금은 목업이다. 6-4 에서 보유 포인트는 `users.points`, 뽑기는 `draw_cards` RPC 로
 *    바뀐다. **추첨은 서버에서 한다** — `mocks/draw.ts` 주석 참고.
 */
const DrawScreen = () => {
  const [ratesOpen, setRatesOpen] = useState(false)
  const points = MOCK_POINTS

  const openPack = (type: DrawType) => {
    router.navigate(`/pack/${type}`)
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="title1">뽑기</Text>
      </View>

      <View style={styles.points}>
        <Text variant="body2" color="textAlt">
          보유 포인트
        </Text>
        <Text variant="display" style={styles.pointsValue}>
          {formatPoints(points)}
        </Text>
      </View>

      <View style={styles.packs}>
        <PackCard type="normal" points={points} onPress={openPack} />
        <PackCard type="premium" points={points} onPress={openPack} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: ratesOpen }}
        onPress={() => {
          setRatesOpen((open) => !open)
        }}
        style={styles.ratesToggle}
      >
        <Text variant="buttonSmall" color="textAlt">
          등급 확률 보기
        </Text>
        <Ionicons
          name={ratesOpen ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={COLORS.textAlt}
        />
      </Pressable>

      {ratesOpen && <GradeRates />}
    </Screen>
  )
}

/**
 * 등급 확률표. 일반·프리미엄을 **한 표에 나란히** 둔다 — 프리미엄이 무엇이 좋은지
 * 두 표를 번갈아 보지 않고 알 수 있다.
 */
const GradeRates = () => (
  <Card>
    <View style={styles.rateRow}>
      <Text variant="caption" color="textAlt" style={styles.rateGrade}>
        등급
      </Text>
      <Text variant="caption" color="textAlt" style={styles.rateValue}>
        일반
      </Text>
      <Text variant="caption" color="textAlt" style={styles.rateValue}>
        프리미엄
      </Text>
    </View>

    {CARD_GRADES.map((grade) => (
      <View key={grade} style={styles.rateRow}>
        <View style={[styles.rateGrade, styles.rateGradeCell]}>
          <View style={[styles.dot, { backgroundColor: CARD_GRADE_META[grade].color }]} />
          <Text variant="body2" color="textNormal">
            {CARD_GRADE_META[grade].label}
          </Text>
        </View>
        <Text variant="body2" color="textNormal" style={[styles.rateValue, styles.tabular]}>
          {DRAW_GRADE_RATES.normal[grade]}%
        </Text>
        <Text variant="body2" color="primary" style={[styles.rateValue, styles.tabular]}>
          {DRAW_GRADE_RATES.premium[grade]}%
        </Text>
      </View>
    ))}
  </Card>
)

const styles = StyleSheet.create({
  header: { paddingTop: SPACING.sm },
  points: { gap: SPACING.xs, paddingTop: SECTION_GAP - SPACING.xs },
  pointsValue: { fontVariant: ['tabular-nums'] },
  packs: { flexDirection: 'row', gap: SPACING.sm + 4, paddingTop: SECTION_GAP },
  ratesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
  },
  rateRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.xs + 1 },
  rateGrade: { flex: 1 },
  rateGradeCell: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  rateValue: { width: 68, textAlign: 'right' },
  tabular: { fontVariant: ['tabular-nums'] },
  dot: { width: 8, height: 8, borderRadius: 4 },
})

export default DrawScreen
