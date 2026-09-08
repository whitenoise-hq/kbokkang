import { Image } from 'expo-image'
import { Pressable, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { gradeColor } from '@kbokkang/shared'
import { COLORS, RADIUS, SPACING } from '@/theme/colors'
import { Text } from '@/components/ui/Text'
import type { DexCardView } from '@/types/dex'

/**
 * 도감 그리드 한 칸.
 *
 * ## `CardFace` 를 쓰지 않는다
 *
 * `CardFace`(뽑기 결과·상세용)는 이름과 등급까지 카드 안에 쓴다. 그리드에서는 칸 폭이
 * 110 안팎이라 그 글자가 다 들어가면 빽빽해서 **아무것도 안 읽힌다.**
 * 여기서는 **등급색 + 도감번호**만 남긴다 — 이름은 상세에서 본다.
 *
 * ## 미보유는 잠긴 카드로 보여준다
 *
 * 빈칸으로 두면 몇 장이 남았는지 알 수 없다. 자물쇠와 `???` 로 **자리를 지켜야**
 * 수집욕이 생긴다(앱기획서 3.4). 다만 등급색은 쓰지 않는다 — 안 가진 카드의 희소도를
 * 미리 알려 주면 도감을 채우는 재미가 줄고, 화면이 알록달록해진다.
 *
 * 여분이 있으면 우상단에 `×3`. 판매 가능 여부는 상세에서 판단한다.
 */
export interface DexCellProps {
  readonly card: DexCardView
  readonly width: number
  readonly onPress: (dexNo: string) => void
}

/** 카드 비율 — `CardFace` 와 같은 0.7(실물 트레이딩 카드) */
const ASPECT = 0.7
/** 하단 도감번호 줄 높이 */
const CAPTION_HEIGHT = 20

export const DexCell = ({ card, width, onPress }: DexCellProps) => {
  const owned = card.ownedCount > 0

  return (
    <Pressable
      onPress={() => {
        onPress(card.dexNo)
      }}
      accessibilityRole="button"
      accessibilityLabel={owned ? `${card.name} ${card.dexNo}` : `미보유 카드 ${card.dexNo}`}
      style={({ pressed }) => [
        styles.cell,
        { width, height: width / ASPECT + CAPTION_HEIGHT },
        { backgroundColor: owned ? gradeColor(card.grade) : COLORS.border },
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={[styles.panel, owned ? styles.panelOwned : styles.panelLocked]}>
        {card.imageUrl === null ? (
          <Ionicons
            name={owned ? 'image-outline' : 'lock-closed'}
            size={owned ? 20 : 18}
            color={COLORS.textDisabled}
          />
        ) : (
          <Image source={{ uri: card.imageUrl }} style={styles.image} contentFit="cover" />
        )}
      </View>

      <Text
        variant="caption"
        align="center"
        style={owned ? styles.captionOwned : styles.captionLocked}
      >
        {owned ? card.dexNo : '???'}
      </Text>

      {card.ownedCount > 1 && (
        <View style={styles.count}>
          <Text variant="caption" style={styles.countText}>
            ×{card.ownedCount}
          </Text>
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  // 등급색이 카드 프레임처럼 보이는 구조 — borderWidth 가 아니라 배경이다
  cell: { borderRadius: RADIUS.md, padding: 5, justifyContent: 'space-between' },
  pressed: { opacity: 0.7 },
  panel: {
    flex: 1,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  panelOwned: { backgroundColor: COLORS.background },
  panelLocked: { backgroundColor: COLORS.surface },
  image: { width: '100%', height: '100%' },
  // 등급색 위에 올라가므로 흰 글씨. 토큰이 아니라 대비 목적의 고정값.
  captionOwned: {
    color: COLORS.background,
    height: CAPTION_HEIGHT,
    lineHeight: CAPTION_HEIGHT,
    fontVariant: ['tabular-nums'],
  },
  captionLocked: {
    color: COLORS.textDisabled,
    height: CAPTION_HEIGHT,
    lineHeight: CAPTION_HEIGHT,
  },
  count: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    paddingHorizontal: SPACING.xs + 1,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.textStrong,
  },
  countText: { color: COLORS.background, lineHeight: 17 },
})
