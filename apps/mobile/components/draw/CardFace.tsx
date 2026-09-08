import { Image } from 'expo-image'
import { StyleSheet, View } from 'react-native'
import { CARD_GRADE_META, gradeColor } from '@kbokkang/shared'
import { COLORS, RADIUS, SPACING } from '@/theme/colors'
import { Text } from '@/components/ui/Text'
import type { DrawnCardView } from '@/types/draw'

/**
 * 카드 한 장의 앞면 — 개봉 결과와 도감이 함께 쓴다.
 *
 * ## 이미지는 통이미지 1장, 글자는 코드로 올린다
 *
 * 이름·도감번호를 이미지에 굽지 않는다(통합기획서). 이름이 바뀌거나 오타가 나면 이미지를
 * 다시 만들어야 하고, 폰트가 기기 해상도에서 흐려진다.
 *
 * ⚠️ **아직 등록된 카드가 없어 `imageUrl` 은 항상 null 이다.** 그래서 등급색 자리표시
 *    프레임을 그린다. 실제 이미지가 들어오면 같은 자리에 이미지가 들어가고 글자 위치는
 *    그대로다 — 카드가 등록되면 이 컴포넌트만 확인하면 된다.
 *
 * 카드 비율은 **0.7**(실물 트레이딩 카드 63×88mm ≈ 0.716)로 고정한다. 폭만 받는다 —
 * 높이를 밖에서 주면 화면마다 카드 모양이 달라진다.
 */
export interface CardFaceProps {
  readonly card: DrawnCardView
  readonly width: number
}

const ASPECT = 0.7

export const cardFaceHeight = (width: number): number => width / ASPECT

export const CardFace = ({ card, width }: CardFaceProps) => {
  const color = gradeColor(card.grade)
  const height = cardFaceHeight(width)

  return (
    <View style={[styles.card, { width, height, backgroundColor: color }]}>
      {card.imageUrl === null ? (
        <View style={styles.placeholder}>
          <Text variant="title2" style={styles.placeholderNo}>
            {card.dexNo}
          </Text>
          <Text variant="caption" color="textAlt">
            이미지 준비 중
          </Text>
        </View>
      ) : (
        <Image source={{ uri: card.imageUrl }} style={styles.image} contentFit="cover" />
      )}

      <View style={styles.caption}>
        <Text variant="button" style={styles.name} numberOfLines={1}>
          {card.name}
        </Text>
        <Text variant="caption" style={styles.meta}>
          {CARD_GRADE_META[card.grade].label} · {card.dexNo}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  // 등급색이 카드 테두리처럼 보이는 구조 — borderWidth 가 아니라 배경이다
  card: { borderRadius: RADIUS.lg, padding: SPACING.sm, justifyContent: 'space-between' },
  image: { flex: 1, borderRadius: RADIUS.md },
  placeholder: {
    flex: 1,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  placeholderNo: { color: COLORS.textDisabled, fontVariant: ['tabular-nums'] },
  caption: { paddingTop: SPACING.sm, paddingHorizontal: SPACING.xs, gap: 1 },
  // 등급색 위에 올라가므로 항상 흰 글씨다. 토큰이 아니라 대비 목적의 고정값.
  name: { color: COLORS.background },
  meta: { color: COLORS.background, opacity: 0.85 },
})
