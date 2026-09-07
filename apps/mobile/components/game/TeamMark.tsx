import { StyleSheet, View } from 'react-native'
import { COLORS, RADIUS } from '@/theme/colors'
import { FONT_FAMILY } from '@/theme/fonts'
import { Text } from '@/components/ui/Text'

/**
 * 구단 표시 — 컬러 원 + 약칭.
 *
 * ⚠️ **구단 로고는 아직 쓰지 않는다.** 실제 KBO 로고는 저작권 판단이 미결이다
 * (통합기획서 8장). 컬러(`teams.color`)와 약칭(`teams.short_name`)은 DB 에 이미 있으므로
 * 그것만으로 구분이 된다.
 *
 * 로고가 확정되면 이 컴포넌트 안에서 원 대신 이미지를 렌더하면 된다 —
 * 화면 코드는 바뀌지 않는다.
 *
 * ⚠️ **원 밖에 팀 이름을 또 쓰지 않는다.** 원 안에 이미 약칭이 있어 중복이고,
 * 한 줄이 늘어나 카드가 세로로 길어진다.
 */
export interface TeamMarkProps {
  readonly shortName: string
  /** `teams.color` — #RRGGBB */
  readonly color: string
  readonly size?: number
  /**
   * 원 안에 약칭을 넣을지. 옆·아래에 팀 이름을 따로 쓰는 곳에서는 **끈다** —
   * 켜두면 같은 글자가 두 번 나온다.
   */
  readonly showLabel?: boolean
}

const DEFAULT_SIZE = 40

export const TeamMark = ({
  shortName,
  color,
  size = DEFAULT_SIZE,
  showLabel = true,
}: TeamMarkProps) => (
  <View
    style={[
      styles.mark,
      { width: size, height: size, borderRadius: RADIUS.full, backgroundColor: color },
    ]}
  >
    {showLabel && (
      <Text
        style={[styles.label, { fontSize: shortName.length > 2 ? size * 0.3 : size * 0.36 }]}
        numberOfLines={1}
      >
        {shortName}
      </Text>
    )}
  </View>
)

const styles = StyleSheet.create({
  mark: { alignItems: 'center', justifyContent: 'center' },
  // 구단 컬러 위에 올라가므로 항상 흰 글씨다. 토큰이 아니라 대비 목적의 고정값.
  label: { color: COLORS.background, fontFamily: FONT_FAMILY.bold },
})
