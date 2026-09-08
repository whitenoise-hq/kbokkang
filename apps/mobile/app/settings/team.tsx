import { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { SCREEN_PADDING, SECTION_GAP, SPACING } from '@/theme/colors'
import { Button } from '@/components/ui/Button'
import { Screen } from '@/components/ui/Screen'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { TeamPicker } from '@/components/profile/TeamPicker'
import { useMyProfile, useUpdateProfile } from '@/hooks/useProfile'

/**
 * 응원팀 변경 — 설정에서 들어온다(앱기획서 3.5).
 *
 * 선택 격자는 **온보딩과 같은 컴포넌트**(`TeamPicker`)다 — 기획서가 같은 화면을 쓰라고
 * 하고, 두 곳에서 따로 만들면 팀 목록·선택 표시가 갈라진다.
 *
 * 저장은 실제로 `users.favorite_team_id` 를 업데이트한다(`useUpdateProfile`).
 *
 * ⚠️ 팀 **목록**은 아직 목업이다(`MOCK_TEAMS`) — 6-4 에서 `teams` 조회로 바꾼다.
 *    id 는 seed 순서와 같게 맞춰 뒀으므로 저장되는 값은 실제와 일치한다.
 */
const TeamScreen = () => {
  const profile = useMyProfile()
  const update = useUpdateProfile()
  const current = profile.data?.favoriteTeamId ?? null

  const [selectedId, setSelectedId] = useState<number | null>(current)

  const changed = selectedId !== current

  return (
    <Screen flush>
      <ScreenHeader title="응원팀 변경" />

      <ScrollView contentContainerStyle={styles.body}>
        <TeamPicker selectedId={selectedId} onSelect={setSelectedId} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="저장"
          onPress={() => {
            update.mutate(
              { favoriteTeamId: selectedId },
              { onSuccess: () => { router.back() } },
            )
          }}
          disabled={!changed}
          loading={update.isPending}
        />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: SCREEN_PADDING, paddingTop: SPACING.md, paddingBottom: SECTION_GAP },
  footer: { paddingHorizontal: SCREEN_PADDING, paddingBottom: SPACING.md },
})

export default TeamScreen
