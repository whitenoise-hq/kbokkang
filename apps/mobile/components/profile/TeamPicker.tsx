import { Pressable, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, RADIUS, SPACING } from '@/theme/colors'
import { shadowStyle } from '@/theme/shadow'
import { Text } from '@/components/ui/Text'
import { TeamMark } from '@/components/game/TeamMark'
import { MOCK_TEAMS } from '@/mocks/profile'
import type { TeamView } from '@/types/profile'

/**
 * 응원팀 선택 — **온보딩과 설정이 같은 컴포넌트를 쓴다**(앱기획서 3.1 / 3.5).
 *
 * ## 목록이 아니라 2열 격자다
 *
 * 10팀은 한 화면에 들어간다. 세로 목록으로 두면 스크롤이 생겨 아래 팀이 안 보이는데,
 * 응원팀 선택은 **한눈에 비교해서 고르는** 행동이라 전부 보이는 편이 낫다.
 *
 * 선택은 옅은 파랑 배경 + 체크다. 구단 컬러가 이미 강하므로 선택 표시까지 색으로 하면
 * 무엇이 선택인지 안 보인다. 테두리는 쓰지 않는다(디자인 가이드 5장) —
 * 미선택은 흰 카드 + 그림자다.
 *
 * ⚠️ 응원팀은 **미선택(null)이 가능**하다(`profileUpdateSchema`). 해제 수단은 두지 않는다 —
 *    선택 화면에 들어온 유저가 팀을 없애려는 경우는 없다. null 은 온보딩을 건너뛴
 *    경로에서만 생긴다.
 *
 * ⚠️ 지금은 목업 목록(`MOCK_TEAMS`)이다. 6-4 에서 `teams` 조회로 바꾼다 —
 *    그때 이 컴포넌트가 `teams` 를 props 로 받게 한다.
 */
export interface TeamPickerProps {
  readonly selectedId: number | null
  readonly onSelect: (id: number) => void
}

export const TeamPicker = ({ selectedId, onSelect }: TeamPickerProps) => (
  <View style={styles.grid}>
    {MOCK_TEAMS.map((team) => (
      <TeamOption key={team.id} team={team} selected={team.id === selectedId} onPress={onSelect} />
    ))}
  </View>
)

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
    accessibilityLabel={team.name}
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm + 2 },
  option: {
    // 2열 — `flexBasis` 로 잡아야 wrap 이 정확히 두 칸으로 나뉜다
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
})
