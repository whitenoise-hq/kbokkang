import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, RADIUS, SCREEN_PADDING, SECTION_GAP, SPACING } from '@/theme/colors'
import { Screen } from '@/components/ui/Screen'
import { Text } from '@/components/ui/Text'
import { isAppleAuthAvailable, signInWithApple, signInWithKakao } from '@/lib/auth'

/**
 * 로그인 — 로그인하지 않았으면 이 화면만 보인다(`app/_layout.tsx` 의 `AuthGate`).
 *
 * **카카오 · 애플만.** 이메일/비밀번호는 받지 않는다 — 이유는 `lib/auth.ts` 주석 참고.
 *
 * ## 브랜드 버튼은 디자인 토큰을 따르지 않는다
 *
 * ⚠️ 카카오·애플은 **버튼 색과 문구를 사업자가 정해 둔다.** 우리 `primary` 파랑으로
 *    칠하면 브랜드 가이드 위반이고 심사에서 지적될 수 있다. 그래서 이 두 버튼만
 *    가이드 밖의 고정색을 쓴다(`#FEE500` 카카오 옐로 / 애플 블랙).
 *    **다른 화면에 이 색을 가져가지 말 것.**
 *
 * **카카오를 위에** 둔다 — 한국 유저 대부분이 그걸 쓴다. 심사 지침 4.8 은 애플 로그인을
 * **동등한 선택지로 제공**하라고 요구하지 순서를 정하지는 않는다(같은 크기로 나란히 두면 된다).
 *
 * ## 애플 버튼이 없을 수 있다
 *
 * `isAppleAuthAvailable()` 이 false 면 아예 그리지 않는다 — 눌러도 안 되는 버튼을 두면
 * 유저는 앱이 고장난 줄 안다. 감추는 **이유는 개발 중 콘솔에 찍힌다**(`lib/auth.ts`).
 *
 * ⚠️ **Expo Go 에서는 애플 버튼이 안 보인다.** 네이티브 모듈이 Expo Go 에 없다 —
 *    `pnpm ios:build` 로 만든 개발 빌드에서만 나타난다(`lib/auth.ts` 주석 참고).
 *
 * 로그인이 끝나면 **관문이 알아서 화면을 옮긴다** — 여기서 이동시키지 않는다.
 */
const LoginScreen = () => {
  const [appleReady, setAppleReady] = useState(false)
  const [busy, setBusy] = useState<'kakao' | 'apple' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void isAppleAuthAvailable().then((available) => {
      if (active) setAppleReady(available)
    })

    return () => {
      active = false
    }
  }, [])

  const run = async (provider: 'kakao' | 'apple') => {
    setError(null)
    setBusy(provider)

    try {
      if (provider === 'kakao') await signInWithKakao()
      else await signInWithApple()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '잠시 후 다시 시도해 주세요')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Screen flush>
      <View style={styles.body}>
        <View style={styles.brand}>
          <Ionicons name="sparkles" size={48} color={COLORS.primary} />
          <Text variant="title1">크보깡</Text>
          <Text variant="body1" color="textAlt" align="center">
            오늘 경기를 예측하고{'\n'}카드를 모아요
          </Text>
        </View>

        <View style={styles.actions}>
          <BrandButton
            label="카카오로 계속하기"
            icon="chatbubble-sharp"
            background={KAKAO_YELLOW}
            foreground={KAKAO_LABEL}
            loading={busy === 'kakao'}
            disabled={busy !== null}
            onPress={() => {
              void run('kakao')
            }}
          />

          {appleReady && (
            <BrandButton
              label="Apple로 계속하기"
              icon="logo-apple"
              background={APPLE_BLACK}
              foreground={COLORS.background}
              loading={busy === 'apple'}
              disabled={busy !== null}
              onPress={() => {
                void run('apple')
              }}
            />
          )}

          {error !== null && (
            <Text variant="caption" color="danger" align="center">
              {error}
            </Text>
          )}

          <Text variant="caption" color="textAlt" align="center" style={styles.notice}>
            처음 로그인하면 계정이 만들어지고 가입 축하 포인트가 지급됩니다
          </Text>
        </View>
      </View>
    </Screen>
  )
}

/**
 * 브랜드 버튼. `Button`(디자인 토큰)을 쓰지 않는 유일한 자리다 —
 * 색과 문구를 사업자 가이드가 정하기 때문이다.
 */
const BrandButton = ({
  label,
  icon,
  background,
  foreground,
  loading,
  disabled,
  onPress,
}: {
  readonly label: string
  readonly icon: keyof typeof Ionicons.glyphMap
  readonly background: string
  readonly foreground: string
  readonly loading: boolean
  readonly disabled: boolean
  readonly onPress: () => void
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ disabled, busy: loading }}
    style={({ pressed }) => [
      styles.brandButton,
      { backgroundColor: background },
      // 브랜드색은 밝히거나 어둡게 할 수 없으니 투명도로만 눌림을 알린다
      pressed && !disabled ? styles.brandPressed : null,
      disabled && !loading ? styles.brandDisabled : null,
    ]}
  >
    {loading ? (
      <ActivityIndicator color={foreground} size="small" />
    ) : (
      <>
        <Ionicons name={icon} size={18} color={foreground} style={styles.brandIcon} />
        <Text variant="button" style={{ color: foreground }}>
          {label}
        </Text>
      </>
    )}
  </Pressable>
)

/**
 * ⚠️ 브랜드 고정색 — 디자인 토큰이 아니다. 사업자 가이드가 정한 값이라
 *    `packages/shared/theme.ts` 에 넣지 않는다(다른 화면에서 쓰일 여지를 만들지 않는다).
 */
const KAKAO_YELLOW = '#FEE500'
const KAKAO_LABEL = '#191600'
const APPLE_BLACK = '#000000'

const BUTTON_HEIGHT = 52

const styles = StyleSheet.create({
  /**
   * **버튼은 하단에 고정, 로고는 그 위 남은 공간의 가운데.**
   *
   * `brand` 가 `flex: 1` 로 남은 높이를 다 먹고 그 안에서 가운데 정렬되므로,
   * 여백이 로고 **위아래로 나뉘어** 배분된다.
   *
   * ⚠️ 시행착오를 남긴다 — 다시 만지기 전에 읽을 것:
   * - 로고와 버튼을 한 덩어리로 묶어 가운데 정렬 → **버튼이 너무 위**로 보였다.
   * - `space-between` 으로 갈라놓고 고정 패딩 → 큰 화면(iPhone 17 Pro)에서 둘 사이에
   *   **340pt 짜리 빈 구멍**이 생겼다. 여백이 한곳에 몰려 화면이 비어 보였다.
   * - 버튼을 바닥에서 40 에 두면 **너무 아래**로 보인다. 72 가 적당했다.
   */
  body: {
    flex: 1,
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: SECTION_GAP * 3,
  },
  brand: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm + 2 },
  actions: { gap: SPACING.sm + 2 },
  brandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: BUTTON_HEIGHT,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  brandIcon: { marginRight: SPACING.sm },
  brandPressed: { opacity: 0.85 },
  brandDisabled: { opacity: 0.5 },
  notice: { paddingHorizontal: SPACING.md },
})

export default LoginScreen
