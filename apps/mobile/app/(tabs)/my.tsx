import { useMemo } from 'react'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { SCREEN_PADDING, SECTION_GAP, SPACING } from '@/theme/colors'
import { Card } from '@/components/ui/Card'
import { Screen } from '@/components/ui/Screen'
import { Text } from '@/components/ui/Text'
import { TeamMark } from '@/components/game/TeamMark'
import { MenuRow } from '@/components/my/MenuRow'
import { signOut } from '@/hooks/useSession'
import { formatPoints } from '@/lib/format'
import { mockProfile } from '@/mocks/profile'

/**
 * 마이 — 프로필 · 잔액 · 메뉴(앱기획서 3.5).
 *
 * **성적(적중률·연승)은 여기 없다.** 예측 탭이 담당한다 — 두 곳에 두면 같은 숫자를 두 번
 * 보여주게 되고 계산이 갈라질 위험도 생긴다(앱기획서 3장 탭 구성).
 *
 * ## 화면에 펼치지 않고 메뉴로 넘긴다
 *
 * 포인트 내역을 마이에 펼쳐 뒀더니 화면 대부분을 차지했는데, 마이에 온 유저가 매번
 * 보고 싶은 것은 아니다. 마이는 **"내가 누구고 얼마 있나"** 까지만 보여주고 나머지는
 * 각자 화면으로 들어간다.
 *
 * ## 메뉴는 성격으로 두 묶음
 *
 * 조회·설정(내역·닉네임·응원팀)과 **계정 정리**(로그아웃·탈퇴)를 카드로 나눈다.
 * 한 목록에 섞으면 탈퇴가 닉네임 변경과 같은 무게로 보인다. 구역 제목("설정")을 붙여
 * 나눠도 봤지만 다섯 줄뿐인데 제목까지 늘어 화면이 층층이 됐다 — 카드 사이 여백만으로
 * 충분히 나뉜다.
 *
 * ## 회원 탈퇴는 반드시 있어야 한다
 *
 * App Store 심사 지침 **5.1.1(v)** — 계정을 만들 수 있는 앱은 앱 안에서 계정을 삭제할
 * 수단을 제공해야 한다. 없으면 리젝된다. 지우지 말 것.
 *
 * ⚠️ 프로필 표시는 아직 목업이다(6-4 에서 `useMyProfile` 로 교체). **로그아웃은 실제로
 *    동작한다.** 회원 탈퇴는 `delete_account` RPC(6-3)가 필요하다 — auth 유저까지 지워야
 *    해서 클라이언트에서 처리할 수 없다.
 */
const MyScreen = () => {
  const profile = useMemo(mockProfile, [])

  const confirmLogout = () => {
    Alert.alert('로그아웃', '로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        onPress: () => {
          // 로그아웃하면 관문(`AuthGate`)이 로그인 화면으로 보낸다 — 여기서 이동시키지 않는다
          void signOut().catch((cause: unknown) => {
            Alert.alert(
              '로그아웃',
              cause instanceof Error ? cause.message : '잠시 후 다시 시도해 주세요',
            )
          })
        },
      },
    ])
  }

  const confirmDelete = () => {
    Alert.alert('회원 탈퇴', '모은 카드와 포인트가 모두 사라지며 되돌릴 수 없습니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '탈퇴',
        style: 'destructive',
        onPress: () => {
          // ⚠️ `delete_account` RPC 는 6-3 에서 만든다. auth 유저까지 지워야 하므로
          //    클라이언트에서 지울 수 없다(service role 이 필요하다).
          Alert.alert('회원 탈퇴', '탈퇴 기능은 아직 준비 중입니다.')
        },
      },
    ])
  }

  return (
    <Screen flush>
      <ScrollView contentContainerStyle={styles.body}>
        <Text variant="title1" style={styles.title}>
          마이
        </Text>

        <Card style={styles.profile}>
          <TeamMark
            shortName={profile.favoriteTeam?.shortName ?? '?'}
            color={profile.favoriteTeam?.color ?? '#C9CDD2'}
            size={48}
          />
          <View style={styles.profileText}>
            <Text variant="title2" numberOfLines={1}>
              {profile.nickname}
            </Text>
            <Text variant="body2" color="textAlt">
              {profile.favoriteTeam?.name ?? '응원팀 미선택'}
            </Text>
          </View>
        </Card>

        <View style={styles.balance}>
          <Text variant="body2" color="textAlt">
            보유 포인트
          </Text>
          <Text variant="display" style={styles.points}>
            {formatPoints(profile.points)}
          </Text>
        </View>

        {/* 카드는 `flush` — 줄이 카드 폭을 꽉 채워야 누르는 영역이 줄 전체가 된다 */}
        <Card flush>
          <MenuRow
            icon="receipt-outline"
            label="포인트 내역"
            chevron
            onPress={() => {
              router.navigate('/points')
            }}
          />
          <MenuRow
            icon="person-outline"
            label="닉네임"
            value={profile.nickname}
            chevron
            onPress={() => {
              router.navigate('/settings/nickname')
            }}
          />
          <MenuRow
            icon="heart-outline"
            label="응원팀"
            value={profile.favoriteTeam?.shortName ?? '미선택'}
            chevron
            onPress={() => {
              router.navigate('/settings/team')
            }}
          />
        </Card>

        <Card flush>
          <MenuRow icon="log-out-outline" label="로그아웃" onPress={confirmLogout} />
          {/* App Store 5.1.1(v) 필수 항목 — 지우지 말 것 */}
          <MenuRow icon="trash-outline" label="회원 탈퇴" tone="danger" onPress={confirmDelete} />
        </Card>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: SCREEN_PADDING, paddingBottom: SECTION_GAP, gap: SPACING.md },
  title: { paddingTop: SPACING.sm, paddingBottom: SPACING.sm },
  profile: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  profileText: { gap: SPACING.xs, flexShrink: 1 },
  balance: { gap: SPACING.xs, paddingTop: SPACING.sm, paddingBottom: SPACING.xs },
  points: { fontVariant: ['tabular-nums'] },
})

export default MyScreen
