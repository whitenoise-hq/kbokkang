import { Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, SPACING, type ColorToken } from '@/theme/colors'
import { Text } from '@/components/ui/Text'

/**
 * 메뉴 목록의 한 줄 — 마이 화면.
 *
 * ## 높이를 고정한다
 *
 * ⚠️ `paddingVertical` 로만 두면 줄마다 내용(값 텍스트·아이콘)이 달라서 **높이가 조금씩
 *    달라진다** — 목록이 들쭉날쭉해 보인다(실제로 그렇게 보였다).
 *    `height: 56` 으로 못 박고 세로 가운데 정렬한다.
 *
 * ## divider 를 쓰지 않는다
 *
 * 줄마다 선을 그으면 다섯 줄에 선이 네 개다. 고정 높이와 앞 아이콘이 이미 리듬을
 * 만들어 주므로 선 없이도 목록으로 읽힌다(디자인 가이드 5장 — 여백이 1순위).
 * 대신 **성격이 다른 묶음은 카드를 나눈다**(조회·설정 / 계정 정리).
 *
 * 앞 아이콘은 `textAlt` 로 조용하게. 줄마다 색이 다르면 메뉴가 알록달록해진다.
 * `tone` 은 파괴적 동작(회원 탈퇴)에만 쓴다 — 남용하면 정작 위험한 줄이 안 보인다.
 */
export interface MenuRowProps {
  /** Ionicons 이름 */
  readonly icon: keyof typeof Ionicons.glyphMap
  readonly label: string
  /** 현재 값. 있으면 라벨 오른쪽에 회색으로 쓴다 */
  readonly value?: string
  readonly tone?: ColorToken
  /** 다음 화면으로 가는 줄인지 — 화살표를 그린다. 즉시 실행되는 줄에는 쓰지 않는다 */
  readonly chevron?: boolean
  readonly onPress: () => void
}

const ROW_HEIGHT = 56
const ICON_SIZE = 19

export const MenuRow = ({
  icon,
  label,
  value,
  tone = 'textStrong',
  chevron = false,
  onPress,
}: MenuRowProps) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={value === undefined ? label : `${label}, 현재 ${value}`}
    style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
  >
    <Ionicons
      name={icon}
      size={ICON_SIZE}
      color={tone === 'danger' ? COLORS.danger : COLORS.textAlt}
      style={styles.icon}
    />

    <Text variant="body1" color={tone} style={styles.label}>
      {label}
    </Text>

    {value !== undefined && (
      <Text variant="body2" color="textAlt" numberOfLines={1}>
        {value}
      </Text>
    )}

    {chevron && (
      <Ionicons
        name="chevron-forward"
        size={16}
        color={COLORS.textDisabled}
        style={styles.chevron}
      />
    )}
  </Pressable>
)

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    // 내용과 무관하게 같은 높이 — 목록이 들쭉날쭉해지지 않게
    height: ROW_HEIGHT,
    paddingHorizontal: SPACING.md,
  },
  icon: { marginRight: SPACING.sm + 4, width: ICON_SIZE, textAlign: 'center' },
  // 라벨이 남은 폭을 먹어 값·화살표를 오른쪽 끝으로 밀어낸다
  label: { flex: 1 },
  chevron: { marginLeft: SPACING.xs },
  // 눌림은 배경색으로 — scale 은 폭이 넓은 줄에서 위아래에 틈이 생겨 깜빡인다
  pressed: { backgroundColor: COLORS.surface },
})
