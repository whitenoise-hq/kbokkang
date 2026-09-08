import { useMemo, useState } from 'react'
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native'
import { router } from 'expo-router'
import {
  CARD_GRADES,
  CARD_GRADE_META,
  CARD_TYPES,
  CARD_TYPE_LABEL,
  gradeColor,
  type CardGrade,
  type CardType,
} from '@kbokkang/shared'
import { SCREEN_PADDING, SECTION_GAP, SPACING } from '@/theme/colors'
import { Screen } from '@/components/ui/Screen'
import { Text } from '@/components/ui/Text'
import { DexCell } from '@/components/dex/DexCell'
import { DexProgressCard } from '@/components/dex/DexProgressCard'
import { FilterChipRow, type FilterChip } from '@/components/dex/FilterChipRow'
import { mockDexCards, mockDexProgress } from '@/mocks/dex'

/**
 * 도감 — 전체 카드 그리드 + 수집률 + 필터(앱기획서 3.4).
 *
 * **미보유 카드도 자리를 지킨다.** 빈칸으로 두면 몇 장이 남았는지 알 수 없어 수집욕이
 * 생기지 않는다. 잠긴 카드로 보여준다(`DexCell`).
 *
 * ## 필터가 진행률을 겸한다
 *
 * 등급 칩에 `일반 8/30` 처럼 숫자를 넣었다. 요약 카드에 등급별 5칸을 또 두면 층이
 * 늘고, 등급을 고를 때 어차피 칩을 본다.
 *
 * ## 그리드는 3열
 *
 * 카드 비율이 0.7 이라 4열이면 칸이 80px 이하로 내려가 도감번호가 안 읽힌다.
 * 2열은 한 화면에 4장뿐이라 "모으는 느낌"이 안 난다.
 *
 * ⚠️ 지금은 목업이다. 6-4 에서 `cards` + 내 `user_cards` 조회로 바꾸고
 *    `mocks/dex.ts` 를 지운다. 그때 **무한 스크롤**을 붙인다 — 90장은 한 번에 그린다.
 */

const COLUMNS = 3
const GAP = SPACING.sm

/** 등급 필터에 쓰는 `전체` 값. 등급 유니온과 섞이지 않게 별도 문자열이다 */
const ALL = 'all' as const
type GradeFilter = CardGrade | typeof ALL
type TypeFilter = CardType | typeof ALL

const DexScreen = () => {
  const { width: screenWidth } = useWindowDimensions()
  const [grade, setGrade] = useState<GradeFilter>(ALL)
  const [cardType, setCardType] = useState<TypeFilter>(ALL)

  const cards = useMemo(mockDexCards, [])
  const progress = useMemo(() => mockDexProgress(cards), [cards])

  const owned = progress.reduce((sum, row) => sum + row.owned, 0)
  const total = progress.reduce((sum, row) => sum + row.total, 0)

  const visible = useMemo(
    () =>
      cards.filter(
        (card) =>
          (grade === ALL || card.grade === grade) &&
          (cardType === ALL || card.cardType === cardType),
      ),
    [cards, grade, cardType],
  )

  const cellWidth = (screenWidth - SCREEN_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS

  const gradeChips: readonly FilterChip<GradeFilter>[] = [
    { value: ALL, label: `전체 ${String(owned)}/${String(total)}` },
    ...CARD_GRADES.map((item) => {
      const row = progress.find((entry) => entry.grade === item)

      return {
        value: item,
        label: `${CARD_GRADE_META[item].label} ${String(row?.owned ?? 0)}/${String(row?.total ?? 0)}`,
        dotColor: gradeColor(item),
      }
    }),
  ]

  const typeChips: readonly FilterChip<TypeFilter>[] = [
    { value: ALL, label: '전체' },
    ...CARD_TYPES.map((item) => ({ value: item, label: CARD_TYPE_LABEL[item] })),
  ]

  return (
    <Screen flush>
      <FlatList
        data={visible}
        keyExtractor={(card) => card.id}
        numColumns={COLUMNS}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.title}>
              <Text variant="title1">도감</Text>
            </View>

            <View style={styles.summary}>
              <DexProgressCard owned={owned} total={total} />
            </View>

            <FilterChipRow chips={gradeChips} selected={grade} onSelect={setGrade} />
            <FilterChipRow chips={typeChips} selected={cardType} onSelect={setCardType} />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="body1" color="textAlt" align="center">
              조건에 맞는 카드가 없습니다
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <DexCell
            card={item}
            width={cellWidth}
            onPress={(dexNo) => {
              router.navigate(`/card/${dexNo}`)
            }}
          />
        )}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: { paddingBottom: SECTION_GAP },
  // 헤더는 화면 폭을 다 쓰고(칩이 가로 스크롤하므로) 좌우 패딩은 각 요소가 갖는다
  header: { gap: SPACING.sm, paddingBottom: SPACING.md },
  title: { paddingTop: SPACING.sm, paddingHorizontal: SCREEN_PADDING },
  summary: { paddingHorizontal: SCREEN_PADDING, paddingTop: SPACING.sm },
  column: { gap: GAP, paddingHorizontal: SCREEN_PADDING, marginBottom: GAP },
  empty: { paddingVertical: SECTION_GAP * 2, paddingHorizontal: SCREEN_PADDING },
})

export default DexScreen
