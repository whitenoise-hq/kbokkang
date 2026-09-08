import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import {
  CARD_GRADE_META,
  CARD_TYPE_LABEL,
  MIN_KEEP_COUNT,
  gradeColor,
  sellPriceOf,
  sellableCount,
} from '@kbokkang/shared'
import { COLORS, RADIUS, SCREEN_PADDING, SECTION_GAP, SPACING } from '@/theme/colors'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Screen } from '@/components/ui/Screen'
import { Text } from '@/components/ui/Text'
import { CardFace } from '@/components/draw/CardFace'
import { formatPoints } from '@/lib/format'
import { mockDexCards } from '@/mocks/dex'

/**
 * 카드 상세 — 도감에서 카드를 누르면 온다(앱기획서 3.4).
 *
 * 카드 이미지를 크게 보여주고(`CardFace` — 뽑기 결과와 **같은 컴포넌트**), 이름·도감번호·
 * 등급·종류·보유 수량을 쓰고, 여분이 있으면 판매한다.
 *
 * ## 여분은 한 번에 판다
 *
 * 판매 가능 수량은 `sellableCount`(shared)가 계산한다 — 도감에서 사라지는 판매를
 * 막는 규칙이라 앱·어드민이 같은 함수를 써야 한다. **마지막 1장은 팔 수 없다.**
 *
 * 한 장씩 팔게 만들었다가 바꿨다 — 여분이 3장이면 세 번 눌러야 했다.
 * 버튼 하나로 **여분 전부**를 판다. 부분 판매는 쓸 상황이 없다(가격이 등급 고정이라
 * 지금 팔든 나중에 팔든 같다).
 *
 * 버튼은 `primary` 다. ⚠️ `secondary` 를 썼더니 배경이 `surface` 라서 **회색 화면과 같은
 * 색이 되어 버튼으로 보이지 않았다**(`Button` 주석 참고). 이 화면에서 유저가 할 수 있는
 * 동작은 판매뿐이라 메인 버튼이 맞다.
 *
 * ## 미보유 카드도 열린다
 *
 * 도감에서 잠긴 칸을 눌러도 여기로 온다. 등급과 종류만 보여주고 이름은 숨긴다 —
 * 이름까지 알려 주면 도감을 채우는 재미가 줄어든다.
 *
 * ⚠️ 판매는 목업이다. 6-4 에서 `sell_card` RPC 로 바꾼다 — **수량 확인과 포인트 지급이
 *    한 트랜잭션**이어야 한다. 지금은 화면 상태만 바꾸므로 도감으로 돌아가면 되돌아간다.
 */
const CardDetailScreen = () => {
  const params = useLocalSearchParams<{ dexNo: string }>()
  const { width: screenWidth } = useWindowDimensions()

  const card = useMemo(
    () => mockDexCards().find((item) => item.dexNo === params.dexNo) ?? null,
    [params.dexNo],
  )

  // 목업 판매용 로컬 상태. 6-4 에서 mutation 결과로 대체된다.
  const [soldCount, setSoldCount] = useState(0)

  if (card === null) {
    return (
      <Screen>
        <Header />
        <View style={styles.missing}>
          <Text variant="body1" color="textAlt" align="center">
            카드를 찾을 수 없습니다
          </Text>
        </View>
      </Screen>
    )
  }

  const ownedCount = Math.max(0, card.ownedCount - soldCount)
  const owned = ownedCount > 0
  const sellable = sellableCount(ownedCount)
  const price = sellPriceOf(card.grade)
  const proceeds = sellable * price
  const meta = CARD_GRADE_META[card.grade]

  return (
    <Screen flush>
      <Header />

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.art}>
          <CardFace
            card={{
              // 미보유 카드는 이름을 숨긴다 — 채우는 재미를 남긴다
              name: owned ? card.name : '???',
              grade: card.grade,
              dexNo: card.dexNo,
              imageUrl: card.imageUrl,
            }}
            width={Math.min(screenWidth * 0.62, 260)}
          />
        </View>

        <Card>
          <Row label="등급">
            <View style={styles.gradeCell}>
              <View style={[styles.dot, { backgroundColor: gradeColor(card.grade) }]} />
              <Text variant="button">{meta.label}</Text>
            </View>
          </Row>
          <Divider />
          <Row label="도감번호">
            <Text variant="button" style={styles.tabular}>
              {card.dexNo}
            </Text>
          </Row>
          <Divider />
          <Row label="종류">
            <Text variant="button">{CARD_TYPE_LABEL[card.cardType]}</Text>
          </Row>
          <Divider />
          <Row label="보유">
            <Text variant="button" color={owned ? 'textStrong' : 'textAlt'} style={styles.tabular}>
              {owned ? `${String(ownedCount)}장` : '없음'}
            </Text>
          </Row>
        </Card>

        {owned && (
          <View style={styles.sell}>
            <Button
              label={
                sellable > 0
                  ? `여분 ${String(sellable)}장 판매 · +${formatPoints(proceeds)}`
                  : '판매할 수 없음'
              }
              onPress={() => {
                setSoldCount((previous) => previous + sellable)
              }}
              disabled={sellable === 0}
            />
            <Text variant="caption" color="textAlt" align="center">
              {sellable > 0
                ? `${meta.label} 1장 ${formatPoints(price)} · 도감에는 1장이 남습니다`
                : `마지막 ${String(MIN_KEEP_COUNT)}장은 팔 수 없습니다`}
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  )
}

/** 전역 헤더를 끄고 있어(`app/_layout.tsx`) 뒤로가기를 화면이 직접 둔다 */
const Header = () => (
  <View style={styles.header}>
    <Pressable
      onPress={() => {
        router.back()
      }}
      accessibilityRole="button"
      accessibilityLabel="뒤로"
      hitSlop={12}
    >
      <Ionicons name="chevron-back" size={26} color={COLORS.textStrong} />
    </Pressable>
  </View>
)

const Row = ({
  label,
  children,
}: {
  readonly label: string
  readonly children: React.ReactNode
}) => (
  <View style={styles.row}>
    <Text variant="body2" color="textAlt">
      {label}
    </Text>
    {children}
  </View>
)

const Divider = () => <View style={styles.divider} />

const styles = StyleSheet.create({
  header: { paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.sm },
  body: { paddingHorizontal: SCREEN_PADDING, paddingBottom: SECTION_GAP, gap: SECTION_GAP },
  art: { alignItems: 'center', paddingTop: SPACING.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm + 2,
  },
  divider: { height: 1, backgroundColor: COLORS.border },
  gradeCell: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  dot: { width: 8, height: 8, borderRadius: RADIUS.full },
  tabular: { fontVariant: ['tabular-nums'] },
  sell: { gap: SPACING.sm + 2 },
  missing: { paddingVertical: SECTION_GAP * 2 },
})

export default CardDetailScreen
