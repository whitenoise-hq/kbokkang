import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { NICKNAME_MAX_LENGTH } from '@kbokkang/shared'
import { SCREEN_PADDING, SECTION_GAP, SPACING } from '@/theme/colors'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Screen } from '@/components/ui/Screen'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { TextField } from '@/components/ui/TextField'
import { NICKNAME_TAKEN_MESSAGE, checkNicknameFormat } from '@/lib/nickname'
import { isNicknameAvailable, useMyProfile, useUpdateProfile } from '@/hooks/useProfile'

/**
 * 닉네임 변경 — 설정에서 들어온다(앱기획서 3.5).
 *
 * 검증은 **온보딩과 같은 함수**(`lib/nickname`)를 쓴다 — 규칙이 두 곳으로 갈라지면
 * 온보딩은 통과한 닉네임이 설정에서 거부되는 일이 생긴다. 경합 처리 등 주의사항은
 * 그 파일의 주석에 모아 뒀다.
 *
 * 저장은 실제로 `users` 를 업데이트한다(`useUpdateProfile`). DB 는 **컬럼 단위 grant** 로
 * 닉네임·응원팀만 수정하게 막아 두었다.
 */
const NicknameScreen = () => {
  const profile = useMyProfile()
  const update = useUpdateProfile()
  const current = profile.data?.nickname ?? ''

  const [value, setValue] = useState(current)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const format = checkNicknameFormat(value)
  const changed = value.trim() !== current
  const canSave = format.ok && changed

  const save = async () => {
    if (!format.ok) {
      setError(format.error)
      return
    }

    setBusy(true)
    try {
      if (!(await isNicknameAvailable(format.value))) {
        setError(NICKNAME_TAKEN_MESSAGE)
        return
      }

      await update.mutateAsync({ nickname: format.value })
      router.back()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '잠시 후 다시 시도해 주세요')
    } finally {
      setBusy(false)
    }
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
            onSubmitEditing={() => {
              void save()
            }}
          />
        </Card>

        <Button
          label="저장"
          onPress={() => {
            void save()
          }}
          disabled={!canSave}
          loading={busy}
        />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: SCREEN_PADDING, paddingTop: SPACING.md, gap: SECTION_GAP },
})

export default NicknameScreen
