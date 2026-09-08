import { useCallback, useMemo, useRef, useState } from 'react'
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import {
  DRAW_COST_SINGLE,
  DRAW_COST_TEN,
  DRAW_TYPE_LABEL,
  TEN_DRAW_COUNT,
  gradeRank,
  isDrawType,
  type DrawType,
} from '@kbokkang/shared'
import { COLORS, DURATION, RADIUS, SPACING } from '@/theme/colors'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { PackPartImage, packPartHeight } from '@/components/draw/PackImage'
import { CardFace } from '@/components/draw/CardFace'
import { formatPoints } from '@/lib/format'
import { MOCK_POINTS, mockDraw } from '@/mocks/draw'
import type { DrawnCardView } from '@/types/draw'

/**
 * 카드팩 개봉 — **전체화면**(디자인 가이드 7.1).
 *
 * 뽑기 탭에서 팩을 고르면 여기로 온다. 탭 바가 보이는 화면에서 개봉하면 연출에 집중되지
 * 않아서 탭 밖의 라우트(`/pack/[type]`)로 분리했다.
 *
 * ## 무대는 어둡다 — 의도된 예외
 *
 * 앱은 라이트 고정이지만 이 화면만 `drawStage`(어두운 남색)를 쓴다. 절단면에서 나오는
 * 빛과 등급 글로우가 연회색 배경에서는 보이지 않는다. **드라마를 이 화면 한 곳에
 * 몰아넣는다**(가이드 7.1 머리말).
 *
 * ## 단계
 *
 * `choose`(장수 고르기) → `ready`(스와이프 대기) → `revealed`(결과).
 *
 * 장수는 **개봉 전에** 고른다. 팩을 자른 뒤에 물으면 이미 연출이 끝나 버린다.
 *
 * ## 자르기는 제스처다 — **가로질러 밀어서 자른다**
 *
 * 자동 재생이 아니라 유저가 **팩 상단을 가로질러 스와이프**해서 자른다 — 촉각적 참여가
 * 긴장감을 만든다(가이드 7.1 ②).
 *
 * 드래그하는 동안 **절단선이 손가락 궤적을 따라 자란다.** 상단 조각도 진행률만큼 살짝
 * 들려 분리되는 느낌을 준다. 팩 폭의 60%를 넘겨 놓으면 잘리고, 모자라면 되감긴다.
 *
 * **제스처는 화면 전체가 받는다** — 팩에만 붙이면 팩을 정확히 짚어야 해서 답답하다.
 * 팩은 폭이 좁고(화면의 56%) 절단면은 그중 한 줄이라 조준하듯 밀어야 했다.
 * 어디서 밀어도 잘리게 하고, 팩과 절단선은 `pointerEvents="none"` 으로 터치를 흘린다.
 *
 * ⚠️ 처음엔 **위로 당기는** 제스처로 만들었는데 바꿨다. 실제 카드팩은 위를 뜯어내는 것이
 *    아니라 **밀봉선을 가로로 뜯는다**. 위로 당기면 팩이 늘어나는 것처럼 보이고,
 *    절단선이라는 개념이 화면에 나타나지 않는다.
 *
 * 절단선 폭은 `width` 대신 **`scaleX` + `transformOrigin`** 으로 늘린다 —
 * `width` 는 네이티브 드라이버가 못 다뤄서 매 프레임 JS 를 거친다(끊긴다).
 *
 * ⚠️⚠️ **`presentation` 같은 화면 옵션을 이 컴포넌트 안에서 `<Stack.Screen options>` 로
 *    주지 말 것.** 리렌더될 때마다 옵션이 다시 적용되면서 **화면이 재마운트**되고,
 *    `useState` 가 초기값으로 돌아간다. 장수를 골라도 `choose` 로 되돌아가서
 *    "버튼 있는 화면이 또 뜬다"고 보였다(겪었다).
 *    옵션은 `app/_layout.tsx` 의 `<Stack.Screen name="pack/[type]">` 에 선언한다.
 *
 * ⚠️ **`Animated`(RN 코어) + `PanResponder` 를 쓴다.** reanimated 4 는 worklet 런타임을
 *    거치는데 이 화면 정도의 연출은 코어 Animated 로 충분하고, `useNativeDriver` 로
 *    scale·opacity·translate 가 전부 네이티브에서 돈다.
 *
 * ⚠️ 아직 없는 것(가이드 7.3): **방사형 빛 PNG·스파클 PNG** 가 없어 빛은 흰 원 두 겹으로
 *    근사했다. `expo-haptics` 도 설치하지 않아 진동이 없다. 에셋이 준비되면 `Burst` 만
 *    교체하면 된다.
 */

/** 팩 폭의 이 비율만큼 가로질러야 잘린다. 너무 짧으면 살짝 스쳐도 열린다 */
const CUT_RATIO = 0.6

/** 상단 조각이 날아가는 거리 */
const TOP_FLY_DISTANCE = 460

/** 자르는 동안 상단 조각이 들리는 최대 높이 — 분리되는 느낌만 준다 */
const TOP_LIFT = 7

/**
 * 절단 연출 길이. **카드는 이게 끝난 뒤에 나온다.**
 * 바로 카드로 넘기면 상단이 날아가는 것을 볼 시간이 없다(실제로 그렇게 보였다).
 */
const CUT_DURATION = 760

const CUT_LINE_HEIGHT = 3
/** 절단선 레이어 높이 — 두꺼운 글로우 선이 잘리지 않을 만큼 */
const CUT_LAYER_HEIGHT = 12
/** "여기를 미세요" 하이라이트 띠의 폭 */
const SHIMMER_WIDTH = 64
/** 절단면에서 좌우로 퍼지는 빛 띠의 기본 두께 */
const BEAM_HEIGHT = 4

/** 하단 영역 최소 높이 — 안내 문구 한 줄 + 버튼 두 개 */
const ACTIONS_MIN_HEIGHT = 148

type Phase = 'choose' | 'ready' | 'cutting' | 'revealed'

const PackOpenScreen = () => {
  const params = useLocalSearchParams<{ type: string }>()
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()

  const [points, setPoints] = useState(MOCK_POINTS)
  const [phase, setPhase] = useState<Phase>('choose')
  const [cards, setCards] = useState<readonly DrawnCardView[]>([])
  /** 지금 몇 번째 카드를 보여주는지 — 10장 뽑기는 한 장씩 넘긴다 */
  const [revealIndex, setRevealIndex] = useState(0)

  /** 장수를 고른 뒤 팩이 커지는 값 0~1 */
  const armed = useRef(new Animated.Value(0)).current
  /** 자르는 진행률 0~1 — 손가락이 팩 폭을 가로지른 비율 */
  const cut = useRef(new Animated.Value(0)).current
  /** 절단 후 연출 0~1 — 상단 날아가기 · 빛 · 하단 퇴장을 한 값으로 몬다 */
  const reveal = useRef(new Animated.Value(0)).current
  /** 절단 순간의 화면 플래시 */
  const flash = useRef(new Animated.Value(0)).current
  /** "옆으로 미세요" 하이라이트 띠가 반복 통과하는 값 */
  const shimmer = useRef(new Animated.Value(0)).current
  /** 지금 보여주는 카드가 떠오르는 값 */
  const cardIn = useRef(new Animated.Value(0)).current

  const type: DrawType = isDrawType(params.type) ? params.type : 'normal'
  const packWidth = Math.min(screenWidth * 0.56, 220)

  const close = useCallback(() => {
    router.back()
  }, [])

  const start = (count: 1 | typeof TEN_DRAW_COUNT) => {
    const cost = count === TEN_DRAW_COUNT ? DRAW_COST_TEN[type] : DRAW_COST_SINGLE[type]
    if (points < cost) return

    // 6-4 에서 `draw_cards` RPC 로 교체한다. 포인트 차감도 서버 트랜잭션에서 일어난다.
    setPoints((previous) => previous - cost)
    setCards(orderForReveal(mockDraw(type, count)))
    setRevealIndex(0)
    setPhase('ready')

    // 팩이 커지면서 절단선이 나타난다 — 이게 없으면 버튼만 바뀌어서
    // "눌렀는데 아무 일도 안 일어났다"고 느낀다(실제로 그런 피드백을 받았다).
    Animated.spring(armed, { toValue: 1, friction: 7, useNativeDriver: true }).start()

    // 절단선 위를 하이라이트 띠가 좌 → 우로 반복 통과한다. 문구보다 이게 먼저 읽힌다.
    shimmer.setValue(0)
    Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 1500, useNativeDriver: true }),
    ).start()
  }

  /** 카드 한 장이 아래에서 솟아오르는 연출. 넘길 때마다 다시 돌린다 */
  const riseCard = useCallback(() => {
    cardIn.setValue(0)
    Animated.timing(cardIn, {
      toValue: 1,
      duration: DURATION.normal,
      useNativeDriver: true,
    }).start()
  }, [cardIn])

  const open = useCallback(() => {
    // 팩을 **남겨둔 채** 절단 연출을 보여준다. 여기서 바로 `revealed` 로 가면 팩이
    // 사라지면서 카드가 튀어나와, 상단이 날아가는 것을 볼 수 없다.
    setPhase('cutting')
    // 절단선을 끝까지 그어 놓는다 — 다 자르지 않은 채로 열리면 어색하다
    Animated.timing(cut, { toValue: 1, duration: 90, useNativeDriver: true }).start()
    shimmer.stopAnimation()

    Animated.parallel([
      Animated.timing(reveal, {
        toValue: 1,
        duration: CUT_DURATION,
        useNativeDriver: true,
      }),
      // 터지는 순간의 흰 플래시 — 짧아야 한다. 길면 눈이 아프다.
      Animated.sequence([
        Animated.timing(flash, { toValue: 1, duration: 70, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]),
    ]).start(({ finished }) => {
      if (!finished) return

      setPhase('revealed')
      riseCard()
    })
  }, [cut, flash, reveal, riseCard, shimmer])

  /**
   * 가로로 밀어서 자른다. **세로 움직임보다 가로가 클 때만** 제스처를 잡는다 —
   * 그러지 않으면 세로로 살짝 스크롤하려 할 때 팩이 잘린다.
   */
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          gesture.dx > 4 && gesture.dx > Math.abs(gesture.dy),
        onPanResponderMove: (_event, gesture) => {
          cut.setValue(Math.max(0, Math.min(1, gesture.dx / packWidth)))
        },
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dx >= packWidth * CUT_RATIO) {
            open()
            return
          }
          // 모자라면 절단선을 되감는다 — 반쯤 잘린 상태를 남기지 않는다
          Animated.spring(cut, { toValue: 0, useNativeDriver: true }).start()
        },
      }),
    [cut, open, packWidth],
  )

  /** 마지막 카드까지 봤는가 */
  const allRevealed = revealIndex >= cards.length - 1

  /**
   * 닫기를 보여줄지.
   *
   * **포인트를 쓴 순간부터 카드를 다 볼 때까지 감춘다.** 장수를 고르면 포인트가 빠지는데
   * 그 직후에 X 가 있으면 실수로 눌러 결과를 못 보고 나가게 되고, 되돌릴 방법이 없다.
   * 고르기 전(`choose`)에는 아무것도 쓰지 않았으니 언제든 나갈 수 있어야 한다.
   */
  const canClose = phase === 'choose' || (phase === 'revealed' && allRevealed)

  const showNext = () => {
    if (allRevealed) return
    setRevealIndex((previous) => previous + 1)
    riseCard()
  }

  const single = DRAW_COST_SINGLE[type]
  const ten = DRAW_COST_TEN[type]
  const flashOpacity = flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] })

  return (
    <View
      style={[styles.stage, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      {...(phase === 'ready' ? pan.panHandlers : {})}
    >
      <View style={styles.topBar}>
        <Text variant="buttonSmall" style={styles.stageText}>
          {formatPoints(points)}
        </Text>
        {canClose && (
          <Pressable
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="닫기"
            hitSlop={12}
          >
            <Ionicons name="close" size={26} color={COLORS.background} />
          </Pressable>
        )}
      </View>

      <View style={styles.center}>
        {phase === 'revealed' ? (
          <RevealedCard
            card={cards[revealIndex] ?? null}
            index={revealIndex}
            total={cards.length}
            progress={cardIn}
            width={Math.min(screenWidth * 0.62, 260)}
            onNext={showNext}
          />
        ) : (
          <Pack
            type={type}
            width={packWidth}
            armed={armed}
            cut={cut}
            reveal={reveal}
            shimmer={shimmer}
          />
        )}
      </View>

      <View style={styles.actions}>
        {phase === 'choose' && (
          <>
            <Text variant="body2" align="center" style={styles.hint}>
              {DRAW_TYPE_LABEL[type]}
            </Text>
            <Button
              label={`1장 뽑기 · ${formatPoints(single)}`}
              onPress={() => {
                start(1)
              }}
              disabled={points < single}
            />
            <Button
              label={`10장 뽑기 · ${formatPoints(ten)}`}
              onPress={() => {
                start(TEN_DRAW_COUNT)
              }}
              variant="secondary"
              disabled={points < ten}
            />
          </>
        )}

        {phase === 'ready' && (
          <View style={styles.swipeHint}>
            <View style={styles.swipeHintRow}>
              <Ionicons name="cut-outline" size={20} color={COLORS.background} />
              <Ionicons name="chevron-forward" size={18} color={COLORS.background} />
            </View>
            <Text variant="body1" align="center" style={styles.stageText}>
              절단선을 옆으로 밀어서 개봉
            </Text>
          </View>
        )}

        {phase === 'revealed' && allRevealed && (
          <>
            <ExtrasHint cards={cards} />
            {/* 닫기는 우상단 X 가 이미 있다 — 버튼 세 개를 쌓으면 결과 카드가 밀려 올라간다 */}
            <Button
              label="한 번 더"
              onPress={() => {
                armed.setValue(0)
                cut.setValue(0)
                reveal.setValue(0)
                cardIn.setValue(0)
                setCards([])
                setRevealIndex(0)
                setPhase('choose')
              }}
            />
          </>
        )}
      </View>

      <Animated.View pointerEvents="none" style={[styles.flash, { opacity: flashOpacity }]} />
    </View>
  )
}

/**
 * **최고 등급을 마지막에** 배치한다(가이드 7.1 ③). 뽑기 결과 자체는 서버가 정하고
 * 클라이언트는 공개 순서만 바꾼다 — 결과를 바꾸는 것이 아니다.
 */
const orderForReveal = (cards: readonly DrawnCardView[]): readonly DrawnCardView[] =>
  [...cards].sort((a, b) => gradeRank(a.grade) - gradeRank(b.grade))

/**
 * 팩 — 상단 조각 / 하단 조각 / 절단선 / 빛.
 *
 * 좌표의 기준은 **절단면**(상단 조각과 하단 조각이 맞닿는 선)이다. 절단선과 빛을 그
 * 자리에 절대 배치해야 "여기가 잘린다"가 읽힌다.
 *
 * ## 절단 연출은 반동으로 만든다
 *
 * 상단이 곧바로 위로 날아가면 밋밋하다. **반대로 살짝 젖혔다가**(-5°) 크게 회전하며
 * 날아가고, 팩 전체가 순간적으로 커졌다 돌아온다(punch). 하단은 마지막에 아래로
 * 빠지며 사라져 카드가 올라올 자리를 비운다.
 */
const Pack = ({
  type,
  width,
  armed,
  cut,
  reveal,
  shimmer,
}: {
  readonly type: DrawType
  readonly width: number
  readonly armed: Animated.Value
  readonly cut: Animated.Value
  readonly reveal: Animated.Value
  readonly shimmer: Animated.Value
}) => {
  const seamY = packPartHeight(type, 'top', width)

  // 장수를 고르면 커지고(가이드 7.1 ② 1단계), 잘리는 순간 한 번 튄다
  const scale = Animated.multiply(
    armed.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }),
    reveal.interpolate({ inputRange: [0, 0.12, 0.4, 1], outputRange: [1, 1.07, 1, 1] }),
  )

  // 자르는 동안 상단이 살짝 들려 분리되는 느낌을 준다
  const lift = cut.interpolate({ inputRange: [0, 1], outputRange: [0, -TOP_LIFT] })
  const flyY = reveal.interpolate({
    inputRange: [0, 0.14, 1],
    outputRange: [0, -30, -TOP_FLY_DISTANCE],
  })
  const flyX = reveal.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, -8, 62] })
  const spin = reveal.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: ['0deg', '-6deg', '20deg'],
  })
  const topFade = reveal.interpolate({ inputRange: [0, 0.72, 1], outputRange: [1, 1, 0] })

  // 하단은 **마지막에** 빠진다 — 먼저 사라지면 무엇이 잘렸는지 알 수 없다
  const bodyY = reveal.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0, 0, 54] })
  const bodyFade = reveal.interpolate({ inputRange: [0, 0.62, 1], outputRange: [1, 1, 0] })

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <View style={styles.packWrap} pointerEvents="none">
        <Animated.View
          pointerEvents="none"
          style={{
            transform: [
              { translateY: Animated.add(lift, flyY) },
              { translateX: flyX },
              { rotate: spin },
            ],
            opacity: topFade,
          }}
        >
          <PackPartImage type={type} part="top" width={width} />
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={{ transform: [{ translateY: bodyY }], opacity: bodyFade }}
        >
          <PackPartImage type={type} part="body" width={width} />
        </Animated.View>

        <Burst progress={reveal} width={width} top={seamY} />
        <CutLine
          progress={cut}
          armed={armed}
          shimmer={shimmer}
          reveal={reveal}
          width={width}
          top={seamY}
        />
      </View>
    </Animated.View>
  )
}

/**
 * 절단선 — **선만 쓴다.**
 *
 * 세 겹이다:
 * 1. **얇은 안내선** — 어디를 뜯는지 보여준다.
 * 2. **하이라이트 띠** — 좌 → 우로 반복 통과한다. **문구보다 이게 먼저 읽힌다.**
 *    드래그를 시작하면(`cut > 0`) 사라진다.
 * 3. **잘린 선** — 손가락 궤적을 따라 자란다. 밑에 두꺼운 반투명 선을 겹쳐 번지게 한다.
 *
 * ⚠️ **원형을 쓰지 않는다.** 선 끝에 빛나는 점을 붙이고 밀봉선을 점으로 깔아 봤는데
 *    점이 자꾸 눈에 걸려 선이 안 읽혔다. 자르는 동작은 선이고, 선만 보여야 한다.
 *
 * `width` 를 애니메이션하면 매 프레임 JS 를 거쳐 끊긴다. 그래서 **폭은 고정하고
 * `scaleX` + `transformOrigin: left`** 로 늘린다(네이티브 드라이버로 돈다).
 */
const CutLine = ({
  progress,
  armed,
  shimmer,
  reveal,
  width,
  top,
}: {
  readonly progress: Animated.Value
  readonly armed: Animated.Value
  readonly shimmer: Animated.Value
  readonly reveal: Animated.Value
  readonly width: number
  readonly top: number
}) => {
  // 드래그를 시작하면 안내 띠를 감춘다 — 실제 절단선과 겹쳐 보이면 혼란스럽다
  const idle = progress.interpolate({
    inputRange: [0, 0.04],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  })

  /**
   * 잘리기 시작하면 **선 전체가 즉시 사라진다.** 팩이 벌어지는 동안 절단선이 남아 있으면
   * 아직 안 잘린 것처럼 보인다(실제로 그렇게 보였다). 벌어진 틈에 선이 떠 있는 셈이다.
   */
  const gone = reveal.interpolate({
    inputRange: [0, 0.1],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  })

  const shimmerX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-SHIMMER_WIDTH, width + SHIMMER_WIDTH],
  })
  const shimmerFade = shimmer.interpolate({
    inputRange: [0, 0.18, 0.82, 1],
    outputRange: [0, 1, 1, 0],
  })

  return (
    <View
      pointerEvents="none"
      style={[styles.cutLayer, { top: top - CUT_LAYER_HEIGHT / 2, width }]}
    >
      <Animated.View
        style={[
          styles.cutTrack,
          { width, opacity: Animated.multiply(Animated.multiply(armed, gone), 0.32) },
        ]}
      />

      <Animated.View
        style={[
          styles.shimmer,
          {
            width: SHIMMER_WIDTH,
            opacity: Animated.multiply(Animated.multiply(armed, idle), shimmerFade),
            transform: [{ translateX: shimmerX }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.cutGlow,
          { width, opacity: Animated.multiply(gone, 0.28), transform: [{ scaleX: progress }] },
        ]}
      />
      <Animated.View
        style={[styles.cutFill, { width, opacity: gone, transform: [{ scaleX: progress }] }]}
      />
    </View>
  )
}

/**
 * 절단면에서 터지는 빛 — **가로 띠 + 원** 두 겹이다.
 *
 * 원만 쓰면 팩이 아니라 화면 가운데에서 뭔가 나오는 것처럼 보인다. 절단면을 따라
 * 좌우로 길게 퍼지는 띠가 있어야 "잘린 자리에서 새어 나온다"가 읽힌다.
 *
 * ⚠️ **방사형 그라디언트 PNG 가 아직 없다**(가이드 7.3). 지금은 흰 도형으로 근사했다.
 *    에셋이 준비되면 이 컴포넌트만 이미지로 바꾼다.
 */
const Burst = ({
  progress,
  width,
  top,
}: {
  readonly progress: Animated.Value
  readonly width: number
  readonly top: number
}) => {
  const ringSize = width * 1.9
  const ringScale = progress.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0.15, 1.1, 1.35],
  })
  const ringFade = progress.interpolate({
    inputRange: [0, 0.12, 0.5],
    outputRange: [0, 0.85, 0],
    extrapolate: 'clamp',
  })

  const beamWidth = width * 1.5
  const beamScaleX = progress.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.2, 1, 1.25] })
  const beamScaleY = progress.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 6, 10] })
  const beamFade = progress.interpolate({
    inputRange: [0, 0.1, 0.45],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  })

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.burst,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            top: top - ringSize / 2,
            marginLeft: -ringSize / 2,
            opacity: ringFade,
            transform: [{ scale: ringScale }],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.beam,
          {
            width: beamWidth,
            top: top - BEAM_HEIGHT / 2,
            marginLeft: -beamWidth / 2,
            opacity: beamFade,
            transform: [{ scaleX: beamScaleX }, { scaleY: beamScaleY }],
          },
        ]}
      />
    </>
  )
}

/**
 * 결과 카드 — **한 장씩** 보여준다.
 *
 * 10장 뽑기를 격자로 한 번에 깔아 봤지만 바꿨다. 카드가 작아져 등급색밖에 안 보이고,
 * **무엇을 뽑았는지 한 장도 제대로 못 본다.** 뽑기의 재미는 한 장 한 장 확인하는 데
 * 있어서 격자는 결과 요약표처럼 읽혔다.
 *
 * 탭하면 다음 장으로 넘어간다. `orderForReveal` 이 **최고 등급을 마지막**에 두므로
 * 넘길수록 기대가 커진다(가이드 7.1 ③).
 *
 * 마지막 장까지 보기 전에는 부모가 `한 번 더`·닫기를 감춘다 — 다 보지 않고 나가면
 * 포인트는 이미 빠졌는데 결과를 되돌려 볼 방법이 없다.
 */
const RevealedCard = ({
  card,
  index,
  total,
  progress,
  width,
  onNext,
}: {
  readonly card: DrawnCardView | null
  readonly index: number
  readonly total: number
  readonly progress: Animated.Value
  readonly width: number
  readonly onNext: () => void
}) => {
  if (card === null) return null

  const last = index >= total - 1
  const opacity = progress
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [36, 0] })
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] })

  return (
    <Pressable
      onPress={onNext}
      disabled={last}
      accessibilityRole="button"
      accessibilityLabel={last ? card.name : `${card.name}, 다음 카드 보기`}
      style={styles.revealWrap}
    >
      {total > 1 && (
        <Text variant="buttonSmall" style={styles.counter}>
          {index + 1} / {total}
        </Text>
      )}

      <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
        <CardFace card={card} width={width} />
        {/* 중복은 우상단 "보유" 배지로 알린다(가이드 7.1 ②). 포인트는 도감에서 팔아야 들어온다 */}
        {card.isDuplicate && (
          <View style={styles.ownedBadge}>
            <Text variant="caption" style={styles.ownedBadgeText}>
              보유
            </Text>
          </View>
        )}
      </Animated.View>

      {!last && (
        <Text variant="body2" align="center" style={styles.hint}>
          탭해서 다음 카드
        </Text>
      )}
    </Pressable>
  )
}

/**
 * 중복이 나왔음을 한 줄로 알린다. **판매 버튼은 두지 않는다.**
 *
 * 결과 화면에서 바로 팔 수 있게 만들어 봤지만 걷어냈다 — 개봉 직후는 **무엇을 뽑았는지
 * 보는 순간**이다. 그 자리에 "파세요" 버튼이 있으면 방금 얻은 카드를 처분하라고
 * 재촉하는 셈이고, 화면의 초점이 결과에서 포인트로 옮겨간다.
 *
 * 판매는 **도감에서만** 한다(`app/card/[dexNo].tsx`) — 여분이 있다는 사실만 알려 주고
 * 처분은 도감을 정리할 때 하게 한다.
 */
const ExtrasHint = ({ cards }: { readonly cards: readonly DrawnCardView[] }) => {
  const extras = cards.filter((card) => card.isDuplicate).length
  if (extras === 0) return null

  return (
    <Text variant="body2" align="center" style={styles.hint}>
      중복 {extras}장 · 도감에서 여분을 판매할 수 있습니다
    </Text>
  )
}

const styles = StyleSheet.create({
  stage: { flex: 1, backgroundColor: COLORS.drawStage },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  packWrap: { alignItems: 'center' },
  // 절단면에서 퍼지도록 가로 중앙에 고정한다(top 은 절단면 좌표를 받아 넣는다)
  burst: { position: 'absolute', left: '50%', backgroundColor: COLORS.background },
  cutLayer: { position: 'absolute', left: 0, height: CUT_LAYER_HEIGHT, justifyContent: 'center' },
  cutTrack: { position: 'absolute', height: 1, backgroundColor: COLORS.background },
  shimmer: {
    position: 'absolute',
    height: CUT_LINE_HEIGHT,
    borderRadius: CUT_LINE_HEIGHT / 2,
    backgroundColor: COLORS.background,
  },
  // 잘린 선 아래에 겹쳐 번지게 하는 두꺼운 선
  cutGlow: {
    position: 'absolute',
    height: CUT_LINE_HEIGHT * 3,
    borderRadius: CUT_LINE_HEIGHT * 1.5,
    backgroundColor: COLORS.background,
    transformOrigin: 'left',
  },
  cutFill: {
    position: 'absolute',
    height: CUT_LINE_HEIGHT,
    borderRadius: CUT_LINE_HEIGHT / 2,
    backgroundColor: COLORS.background,
    transformOrigin: 'left',
  },
  beam: {
    position: 'absolute',
    left: '50%',
    height: BEAM_HEIGHT,
    backgroundColor: COLORS.background,
  },
  flash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
  },
  revealWrap: { alignItems: 'center', gap: SPACING.md },
  counter: { color: COLORS.background, opacity: 0.6, fontVariant: ['tabular-nums'] },
  actions: {
    gap: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    // 단계마다 버튼 수가 달라서 높이를 고정하지 않으면 **팩이 위아래로 움직인다** —
    // 절단 애니메이션 중에 무대가 흔들려 보인다.
    minHeight: ACTIONS_MIN_HEIGHT,
    justifyContent: 'flex-end',
  },
  // 어두운 무대 위라 항상 흰 글씨다. 토큰이 아니라 대비 목적의 고정값.
  stageText: { color: COLORS.background },
  hint: { color: COLORS.background, opacity: 0.7 },
  swipeHint: { alignItems: 'center', gap: SPACING.xs, paddingBottom: SPACING.md },
  swipeHintRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ownedBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    paddingHorizontal: SPACING.sm - 1,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.textStrong,
  },
  ownedBadgeText: { color: COLORS.background, lineHeight: 18 },
})

export default PackOpenScreen
