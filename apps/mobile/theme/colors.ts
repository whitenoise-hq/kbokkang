/**
 * 디자인 토큰 재노출.
 *
 * 플레이북은 앱마다 `theme/colors.ts` 를 단일 출처로 두라고 한다. kbokkang 은 모노레포라
 * **`packages/shared/theme.ts` 가 상위 단일 출처**다(어드민도 primary 를 여기서 가져간다).
 * 그래서 이 파일은 토큰을 **정의하지 않고 재노출만** 한다 — 플레이북의 임포트 관례를
 * 지키면서 값이 두 곳으로 갈라지는 것을 막는다.
 *
 * ⚠️ 여기에 새 색을 정의하지 말 것. `docs/04_앱디자인가이드.md` → `packages/shared/theme.ts`
 *    순서로 고친다. 컴포넌트에 hex 를 직접 쓰는 것도 금지.
 */
export {
  BUTTON_HEIGHT,
  COLORS,
  DURATION,
  gradeColor,
  PRESS_SCALE,
  RADIUS,
  SCREEN_PADDING,
  SECTION_GAP,
  SHADOW,
  SPACING,
  TYPOGRAPHY,
} from '@kbokkang/shared'

export type {
  ColorToken,
  DurationToken,
  FontWeightToken,
  RadiusToken,
  ShadowToken,
  SpacingToken,
  TypographyToken,
} from '@kbokkang/shared'
