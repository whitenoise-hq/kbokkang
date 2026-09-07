import { useCallback, useMemo, useState } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import type { PredictionPick } from '@kbokkang/shared'
import { Screen } from '@/components/ui/Screen'
import { Text } from '@/components/ui/Text'
import { GameCard } from '@/components/game/GameCard'
import { YesterdayBanner } from '@/components/game/YesterdayBanner'
import { useServerNow } from '@/hooks/useServerNow'
import { formatDateWithWeekday } from '@/lib/format'
import { mockGames, mockYesterdaySummary } from '@/mocks/games'
import { SECTION_GAP, SCREEN_PADDING, SPACING } from '@/theme/colors'
import type { GameView } from '@/types/game'

/**
 * 홈 (예측) — 앱기획서 3.2. ★핵심 화면
 *
 * **당일 경기만** 큼직한 카드로 세로 나열한다. 하루 최대 5경기라 페이지네이션이 없다.
 * 지난 날짜 예측은 섞지 않는다 — 예측 탭이 담당한다("한 화면 한 핵심 행동").
 *
 * 다만 상단에 **어제 결과 한 줄 배너**를 둔다. 예측 앱을 여는 가장 큰 동기가
 * "내가 맞췄나?" 인데 예측 탭에만 두면 확인 경로가 한 단계 늘어난다.
 *
 * ## 저장하지 않은 선택(draft)은 화면이 들고 있다
 *
 * 카드가 자기 draft 를 `useState` 로 가지면 FlatList 윈도잉으로 화면 밖에 나갔다 돌아올 때
 * 선택이 사라질 수 있다. 그래서 **화면이 gameId → 선택 맵으로 관리**한다.
 *
 * ⚠️ 지금은 목업이다. 6-4 에서 TanStack Query 훅으로 교체하고 `mocks/games.ts` 를 지운다.
 *    저장도 mutation 으로 바뀐다 — 그때 `saving` 은 mutation 의 상태를 쓴다.
 */
const HomeScreen = () => {
  const now = useServerNow()
  const [games, setGames] = useState<readonly GameView[]>(mockGames)
  const [drafts, setDrafts] = useState<Readonly<Record<string, PredictionPick>>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const yesterday = useMemo(mockYesterdaySummary, [])

  const handleSelect = useCallback((gameId: string, pick: PredictionPick) => {
    setDrafts((previous) => ({ ...previous, [gameId]: pick }))
  }, [])

  const handleSave = useCallback(
    (gameId: string) => {
      const pick = drafts[gameId]
      if (pick === undefined) return

      setSavingId(gameId)

      // 6-4 에서 mutation 으로 교체한다. 지금은 저장된 것처럼 상태만 옮긴다.
      setGames((previous) =>
        previous.map((game) =>
          game.id === gameId
            ? {
                ...game,
                myPrediction: {
                  pickHomeScore: game.myPrediction?.pickHomeScore ?? null,
                  pickAwayScore: game.myPrediction?.pickAwayScore ?? null,
                  result: 'pending',
                  earnedPoints: null,
                  pickWinner: pick,
                },
              }
            : game,
        ),
      )

      // 저장이 끝나면 draft 를 비운다 — 저장값과 같아지면 저장 버튼이 사라진다.
      setDrafts((previous) => {
        const { [gameId]: _saved, ...rest } = previous
        return rest
      })
      setSavingId(null)
    },
    [drafts],
  )

  const today = useMemo(() => formatDateWithWeekday(now.toISOString()), [now])

  return (
    <Screen flush>
      <FlatList
        data={games}
        keyExtractor={(game) => game.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.title}>
              <Text variant="title1">오늘 경기</Text>
              <Text variant="body2" color="textAlt">
                {today}
              </Text>
            </View>

            {yesterday !== null && (
              <YesterdayBanner
                summary={yesterday}
                onPress={() => {
                  router.navigate('/predict')
                }}
              />
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="body1" color="textAlt" align="center">
              오늘은 경기가 없습니다
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <GameCard
            game={item}
            now={now}
            draftPick={drafts[item.id] ?? null}
            saving={savingId === item.id}
            onSelect={handleSelect}
            onSave={handleSave}
          />
        )}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: SCREEN_PADDING, paddingBottom: SECTION_GAP },
  header: { gap: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SECTION_GAP },
  title: { gap: SPACING.xs },
  separator: { height: SPACING.md },
  empty: { paddingVertical: SECTION_GAP * 2 },
})

export default HomeScreen
