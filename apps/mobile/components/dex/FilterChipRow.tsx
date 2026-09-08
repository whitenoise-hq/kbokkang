import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { COLORS, RADIUS, SCREEN_PADDING, SPACING } from '@/theme/colors'
import { shadowStyle } from '@/theme/shadow'
import { Text } from '@/components/ui/Text'

/**
 * 필터 칩 한 줄 — 도감의 등급·종류 필터.
 *
 * 등급 칩에는 **진행률 숫자**가 함께 들어간다(`일반 8/30`). 필터를 고르려면 어차피
 * 여기를 보므로, 진행률을 요약 카드에 또 두지 않고 여기 합쳤다.
 *
 * 등급색은 **왼쪽 작은 점**으로만 쓴다. 글자까지 등급색으로 칠해 보니 칩 다섯 개가
 * 알록달록해져 무엇이 선택됐는지 안 보였다. 선택은 `primary` **배경**으로 알린다.
 *
 * 테두리를 쓰지 않는다(디자인 가이드 5장) — 미선택 칩은 흰 배경 + 그림자다.
 * 칩이 화면 폭을 넘으면 가로 스크롤한다(등급 6칩은 실제로 넘는다).
 */
export interface FilterChip<T extends string> {
  readonly value: T
  readonly label: string
  /** 등급 칩에서만 쓴다 — 왼쪽 점 색 */
  readonly dotColor?: string
}

export interface FilterChipRowProps<T extends string> {
  readonly chips: readonly FilterChip<T>[]
  readonly selected: T
  readonly onSelect: (value: T) => void
}

export const FilterChipRow = <T extends string>({
  chips,
  selected,
  onSelect,
}: FilterChipRowProps<T>) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
    {chips.map((chip) => {
      const active = chip.value === selected

      return (
        <Pressable
          key={chip.value}
          onPress={() => {
            onSelect(chip.value)
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: active }}
          style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}
        >
          {chip.dotColor !== undefined && !active && (
            <View style={[styles.dot, { backgroundColor: chip.dotColor }]} />
          )}
          <Text variant="buttonSmall" color={active ? 'background' : 'textNormal'}>
            {chip.label}
          </Text>
        </Pressable>
      )
    })}
  </ScrollView>
)

const styles = StyleSheet.create({
  // 화면 좌우 패딩을 스크롤 내용에 준다 — 첫 칩이 화면 끝에 붙지 않게
  row: { gap: SPACING.sm - 2, paddingHorizontal: SCREEN_PADDING, paddingVertical: SPACING.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 1,
    height: 32,
    paddingHorizontal: SPACING.md - 2,
    borderRadius: RADIUS.full,
  },
  chipIdle: { backgroundColor: COLORS.background, ...shadowStyle('card') },
  chipActive: { backgroundColor: COLORS.primary },
  dot: { width: 6, height: 6, borderRadius: 3 },
})
