import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { NICKNAME_MAX_LENGTH, nicknameSchema } from '@kbokkang/shared'
import { SCREEN_PADDING, SECTION_GAP, SPACING } from '@/theme/colors'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Screen } from '@/components/ui/Screen'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { TextField } from '@/components/ui/TextField'
import { MOCK_TAKEN_NICKNAMES, mockProfile } from '@/mocks/profile'

/**
 * 닉네임 변경 — 설정에서 들어온다(앱기획서 3.5).
 *
 * **온보딩과 같은 검증을 쓴다**(`nicknameSchema`, shared). 규칙이 두 곳으로 갈라지면
 * 온보딩은 통과한 닉네임이 설정에서 거부되는 일이 생긴다. DB 에도 같은 제약이 있다
 * (`users_nickname_length` / `users_nickname_format`).
 *
 * ## 저장 전에 중복을 확인한다
 *
 * 형식 검증(길이·문자)은 입력할 때마다 즉시, **중복 확인은 저장을 누를 때** 한다 —
 * 한 글자마다 서버를 부르면 낭비다. 실제로는 `is_nickname_available` RPC 를 쓴다.
 *
 * ⚠️ **중복 확인과 저장 사이에 경합이 있다.** 확인은 통과했지만 저장 순간 다른 사람이
 *    같은 닉네임을 쓸 수 있다. 그래서 6-4 에서는 저장의 **unique 위반 에러도** 처리해야
 *    한다(앱기획서 3.1). 확인만 믿으면 저장이 조용히 실패한다.
 *
 * ⚠️ 지금은 목업이다. 저장해도 마이 화면으로 돌아가면 되돌아간다.
 */
const NicknameScreen = () => {
  const current = mockProfile().nickname
  const [value, setValue] = useState(current)
  const [error, setError] = useState<string | null>(null)

  const parsed = nicknameSchema.safeParse(value)
  const changed = value.trim() !== current
  const canSave = parsed.success && changed

  const save = () => {
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '닉네임을 확인해 주세요')
      return
    }

    // 6-4 에서 `is_nickname_available` RPC 로 교체한다
    const taken = MOCK_TAKEN_NICKNAMES.some(
      (item) => item.toLowerCase() === parsed.data.toLowerCase(),
    )
    if (taken) {
      setError('이미 사용 중인 닉네임입니다')
      return
    }

    router.back()
  }

  return (
    <Screen flush>
      <ScreenHeader title="닉네임 변경" />

      <View style={styles.body}>
        <Card>
          <TextField
            value={value}
            onChangeText={(next) => {
              setValue(next)
              // 고치기 시작하면 오류를 지운다 — 남아 있으면 이미 고친 것을 계속 지적한다
              setError(null)
            }}
            placeholder="닉네임"
            maxLength={NICKNAME_MAX_LENGTH}
            error={error}
            hint={`${String(value.trim().length)}/${String(NICKNAME_MAX_LENGTH)} · 한글·영문·숫자`}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={save}
          />
        </Card>

        <Button label="저장" onPress={save} disabled={!canSave} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: SCREEN_PADDING, paddingTop: SPACING.md, gap: SECTION_GAP },
})

export default NicknameScreen
