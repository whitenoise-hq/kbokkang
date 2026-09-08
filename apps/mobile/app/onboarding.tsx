import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { NICKNAME_MAX_LENGTH, POINT_REWARD } from '@kbokkang/shared'
import { COLORS, RADIUS, SCREEN_PADDING, SECTION_GAP, SPACING } from '@/theme/colors'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Screen } from '@/components/ui/Screen'
import { Text } from '@/components/ui/Text'
import { TextField } from '@/components/ui/TextField'
import { TeamPicker } from '@/components/profile/TeamPicker'
import { formatPoints } from '@/lib/format'
import { NICKNAME_TAKEN_MESSAGE, checkNicknameFormat } from '@/lib/nickname'
import { isNicknameAvailable, useUpdateProfile } from '@/hooks/useProfile'

/**
 * 온보딩 — **최초 1회** 닉네임 + 응원팀(앱기획서 3.1).
 *
 * 가입 폼에서 닉네임을 받지 않는다. OAuth 로그인은 **가입 폼 자체가 없어서** 물어볼
 * 화면이 없다. 그래서 가입 트리거가 `nickname is null` 인 프로필 행을 만들고,
 * 앱이 `nickname is null` 이면 이 화면으로 보낸다.
 *
 * ## 두 단계로 나눈다
 *
 * 닉네임과 응원팀을 한 화면에 세로로 쌓으면 10팀 격자 때문에 스크롤이 생기고, 입력칸이
 * 키보드에 가린다. "한 화면 = 한 핵심 행동"(디자인 가이드 0장)에 따라 단계로 쪼갠다.
 *
 * **라우트를 두 개로 나누지 않고 한 화면의 상태로 둔다.** 닉네임 값을 다음 단계로
 * 넘겨야 하는데 라우트를 나누면 파라미터나 전역 상태가 필요하고, 온보딩은 중간에
 * 다른 곳으로 갈 수 있는 흐름이 아니라 스택으로 쌓을 이유가 없다.
 *
 * ## 응원팀은 건너뛸 수 있다
 *
 * `favoriteTeamId` 는 nullable 이다(`profileUpdateSchema`). 아직 응원팀이 없는 사람에게
 * 하나를 고르라고 막아 세우면 첫 화면에서 이탈한다. 설정에서 언제든 정할 수 있다.
 * 반대로 **닉네임은 건너뛸 수 없다** — 없으면 앱이 다시 온보딩으로 보낸다.
 *
 * 진입은 **관문(`app/_layout.tsx` 의 `AuthGate`)이** 결정한다 — 로그인했고 `nickname` 이
 * null 이면 여기로 온다. 저장이 끝나면 닉네임이 채워지므로 관문이 탭으로 보낸다.
 *
 * 가입 보너스 200P 는 **DB 트리거**(`handle_new_user`)가 가입 시점에 이미 지급했다 —
 * 이 화면은 알려 주기만 한다.
 */
const TOTAL_STEPS = 2

const OnboardingScreen = () => {
  const [step, setStep] = useState<1 | 2>(1)
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [teamId, setTeamId] = useState<number | null>(null)
  const [checking, setChecking] = useState(false)

  const update = useUpdateProfile()
  const format = checkNicknameFormat(nickname)

  const goToTeam = async () => {
    if (!format.ok) {
      setError(format.error)
      return
    }

    setChecking(true)
    try {
      // 중복은 이 시점에 한 번만 묻는다 — 한 글자마다 서버를 부르면 낭비다
      if (!(await isNicknameAvailable(format.value))) {
        setError(NICKNAME_TAKEN_MESSAGE)
        return
      }
      setStep(2)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '잠시 후 다시 시도해 주세요')
    } finally {
      setChecking(false)
    }
  }

  /**
   * 저장하면 `nickname` 이 채워지므로 **관문(`AuthGate`)이 알아서 탭으로 보낸다.**
   * 여기서 `router.replace` 하지 않는다 — 저장 실패 시 화면만 넘어가 온보딩이
   * 다시 뜨는 왕복이 생긴다.
   */
  const finish = () => {
    if (!format.ok) return

    update.mutate(
      { nickname: format.value, favoriteTeamId: teamId },
      {
        onError: (cause: Error) => {
          // 확인과 저장 사이에 다른 사람이 같은 닉네임을 쓴 경우 1단계로 돌려보낸다
          setError(cause.message)
          setStep(1)
        },
      },
    )
  }

  return (
    <Screen flush>
      <View style={styles.header}>
        {step === 2 ? (
          <Pressable
            onPress={() => {
              setStep(1)
            }}
            accessibilityRole="button"
            accessibilityLabel="이전 단계"
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={26} color={COLORS.textStrong} />
          </Pressable>
        ) : (
          // 1단계에서는 돌아갈 곳이 없다 — 자리만 비워 제목 위치가 흔들리지 않게 한다
          <View style={styles.backSpacer} />
        )}

        <StepDots step={step} />
      </View>

      {step === 1 ? (
        <View style={styles.body}>
          <View style={styles.intro}>
            <Text variant="title1">어떻게 불러드릴까요?</Text>
            <Text variant="body1" color="textAlt">
              닉네임은 나중에 설정에서 바꿀 수 있어요.
            </Text>
          </View>

          <Card>
            <TextField
              value={nickname}
              onChangeText={(next) => {
                setNickname(next)
                // 고치기 시작하면 오류를 지운다 — 남아 있으면 이미 고친 것을 계속 지적한다
                setError(null)
              }}
              placeholder="닉네임"
              maxLength={NICKNAME_MAX_LENGTH}
              error={error}
              hint={`${String(nickname.trim().length)}/${String(NICKNAME_MAX_LENGTH)} · 한글·영문·숫자`}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={() => {
                void goToTeam()
              }}
            />
          </Card>

          <View style={styles.footer}>
            <Button
              label="다음"
              onPress={() => {
                void goToTeam()
              }}
              disabled={!format.ok}
              loading={checking}
            />
          </View>
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.intro}>
            <Text variant="title1">응원하는 팀이 있나요?</Text>
            <Text variant="body1" color="textAlt">
              지금 정하지 않아도 괜찮아요.
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.teams}>
            <TeamPicker selectedId={teamId} onSelect={setTeamId} />
          </ScrollView>

          <View style={styles.footer}>
            <Text variant="caption" color="textAlt" align="center">
              가입 축하 {formatPoints(POINT_REWARD.signup)}가 이미 들어와 있어요
            </Text>
            <Button
              label={teamId === null ? '건너뛰고 시작' : '시작하기'}
              onPress={finish}
              loading={update.isPending}
            />
          </View>
        </View>
      )}
    </Screen>
  )
}

/**
 * 진행 표시 — 점 두 개.
 *
 * `1 / 2` 같은 숫자보다 점이 조용하다. 온보딩은 두 단계뿐이라 몇 개 남았는지 세는
 * 화면이 아니고, "거의 끝났다" 는 느낌만 주면 된다.
 */
const StepDots = ({ step }: { readonly step: number }) => (
  <View style={styles.dots}>
    {Array.from({ length: TOTAL_STEPS }, (_unused, index) => (
      <View key={index} style={[styles.dot, index < step ? styles.dotOn : styles.dotOff]} />
    ))}
  </View>
)

const BACK_WIDTH = 26
const DOT_SIZE = 6

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.sm,
  },
  backSpacer: { width: BACK_WIDTH },
  dots: { flexDirection: 'row', gap: SPACING.xs + 2, marginLeft: SPACING.sm },
  dot: { width: DOT_SIZE, height: DOT_SIZE, borderRadius: RADIUS.full },
  dotOn: { backgroundColor: COLORS.primary },
  dotOff: { backgroundColor: COLORS.border },
  // 단계 내용이 화면을 채우고 버튼은 아래에 붙는다
  body: { flex: 1, paddingHorizontal: SCREEN_PADDING, gap: SECTION_GAP },
  intro: { gap: SPACING.sm, paddingTop: SPACING.md },
  teams: { paddingBottom: SPACING.md },
  footer: { gap: SPACING.sm + 2, paddingBottom: SPACING.md, marginTop: 'auto' },
})

export default OnboardingScreen
