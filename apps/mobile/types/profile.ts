import type { PointReason } from '@kbokkang/shared'

/** 구단 — 응원팀 선택에 쓴다. `teams` 테이블 대응 */
export interface TeamView {
  readonly id: number
  readonly name: string
  readonly shortName: string
  /** `teams.color` — #RRGGBB */
  readonly color: string
}

/**
 * 내 프로필 — 마이 화면.
 *
 * **성적(적중률·연승)은 담지 않는다.** 예측 탭이 담당한다(앱기획서 3장 탭 구성) —
 * 두 곳에 성적을 두면 같은 숫자를 두 번 보여주게 되고, 계산이 갈라질 위험도 생긴다.
 * 마이는 계정·포인트·설정에 집중한다.
 */
export interface ProfileView {
  readonly nickname: string
  /** 응원팀. 미선택이면 null */
  readonly favoriteTeam: TeamView | null
  readonly points: number
}

/** 포인트 변동 한 줄 — `point_transactions` 대응 */
export interface PointEntryView {
  readonly id: string
  readonly reason: PointReason
  /** 획득은 양수, 사용은 음수 */
  readonly amount: number
  /** ISO */
  readonly createdAt: string
}
