import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, RADIUS, SCREEN_PADDING, SECTION_GAP, SPACING } from '@/theme/colors'
import { Button } from '@/components/ui/Button'
import { Screen } from '@/components/ui/Screen'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { Text } from '@/components/ui/Text'
import { TeamMark } from '@/components/game/TeamMark'
import { shadowStyle } from '@/theme/shadow'
import { MOCK_TEAMS, mockProfile } from '@/mocks/profile'
import type { TeamView } from '@/types/profile'

/**
 * 응원팀 변경 — 설정에서 들어온다(앱기획서 3.5). **온보딩이 같은 화면을 쓴다.**
 *
 * ## 목록이 아니라 2열 격자다
 *
 * 10팀은 한 화면에 들어간다. 세로 목록으로 두면 스크롤이 생겨 아래 팀이 안 보이고,
 * 응원팀 선택은 **한눈에 비교해서 고르는** 행동이라 전부 보이는 편이 낫다.
 *
 * 선택은 옅은 파랑 배경 + 체크(디자인 가이드 5장 — 테두리를 쓰지 않는다).
 * 구단 컬러가 이미 강하므로 선택 표시까지 색으로 하면 무엇이 선택인지 안 보인다.
 *
 * ⚠️ 응원팀은 **미선택(null)이 가능**하다(`profileUpdateSchema`). 다만 이 화면에서는
 *    선택을 해제할 수단을 두지 않는다 — 설정에 들어온 유저가 팀을 없애려는 경우는 없다.
 *    온보딩에서 넘기는 경로로만 null 이 된다.
 *
 * ⚠️ 지금은 목업이다. 저장해도 마이 화면으로 돌아가면 되돌아간다.
 */
const TeamScreen = () => {
  const current = mockProfile().favoriteTeam
  const [selectedId, setSelectedId] = useState<number | null>(current?.id ?? null)

  const changed = selectedId !== (current?.id ?? null)

  return (
    <Screen flush>
      <ScreenHeader title="응원팀 변경" />

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.grid}>
          {MOCK_TEAMS.map((team) => (
            <TeamOption
              key={team.id}
              team={team}
              selected={team.id === selectedId}
              onPress={setSelectedId}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="저장"
          onPress={() => {
            router.back()
          }}
          disabled={!changed}
        />
      </View>
    </Screen>
  )
}

const TeamOption = ({
  team,
  selected,
  onPress,
}: {
  readonly team: TeamView
  readonly selected: boolean
  readonly onPress: (id: number) => void
}) => (
  <Pressable
    onPress={() => {
      onPress(team.id)
    }}
    accessibilityRole="button"
    accessibilityState={{ selected }}
    style={({ pressed }) => [
      styles.option,
      selected ? styles.optionSelected : styles.optionIdle,
      pressed && !selected ? styles.optionPressed : null,
    ]}
  >
    <TeamMark shortName={team.shortName} color={team.color} size={36} />
    <Text
      variant="button"
      color={selected ? 'primary' : 'textStrong'}
      numberOfLines={1}
      style={styles.optionName}
    >
      {team.shortName}
    </Text>
    {selected && <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />}
  </Pressable>
)

const styles = StyleSheet.create({
  body: { paddingHorizontal: SCREEN_PADDING, paddingTop: SPACING.md, paddingBottom: SECTION_GAP },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm + 2 },
  option: {
    // 2열 — gap 을 뺀 절반. `flexBasis` 로 잡아야 wrap 이 정확히 두 칸으로 나뉜다
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.md - 2,
    borderRadius: RADIUS.lg,
  },
  optionIdle: { backgroundColor: COLORS.background, ...shadowStyle('card') },
  optionSelected: { backgroundColor: COLORS.primaryLight },
  optionPressed: { backgroundColor: COLORS.surface },
  optionName: { flexShrink: 1 },
  footer: { paddingHorizontal: SCREEN_PADDING, paddingBottom: SPACING.md },
})

export default TeamScreen
