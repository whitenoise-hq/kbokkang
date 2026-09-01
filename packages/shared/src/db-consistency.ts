/**
 * 손으로 쓴 상수와 DB enum 이 어긋나지 않게 컴파일 타임에 묶는다.
 *
 * `database.types.ts` 는 `supabase gen types typescript` 로 생성되는 파일이다.
 * 마이그레이션에서 enum 값을 바꾸면 타입이 갱신되고, 그때 이 파일이 타입 에러로 알려준다.
 * 이 파일이 없으면 상수와 DB 가 조용히 어긋나 런타임에서 터진다.
 *
 * ⚠️ database.types.ts 는 직접 수정하지 않는다. 재생성:
 *    supabase gen types typescript --linked --schema public > packages/shared/src/database.types.ts
 */

import type { Database } from './database.types'
import type { CARD_GRADES } from './grades'
import type { CARD_TYPES } from './card-types'
import type { DRAW_TYPES } from './draw'
import type { GAME_STATUSES, PREDICTION_PICKS, PREDICTION_RESULTS } from './game'
import type { POINT_REASONS } from './points'

type DbEnums = Database['public']['Enums']

/** 양방향 동일성 검사 — 한쪽에만 있는 값이 있으면 never 가 되어 에러가 난다 */
type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never

const assertExact = <T extends true>(_check: T): void => {
  /* 컴파일 타임 전용. 런타임 동작 없음 */
}

assertExact<Exact<(typeof CARD_GRADES)[number], DbEnums['card_grade']>>(true)
assertExact<Exact<(typeof CARD_TYPES)[number], DbEnums['card_type']>>(true)
assertExact<Exact<(typeof DRAW_TYPES)[number], DbEnums['draw_type']>>(true)
assertExact<Exact<(typeof GAME_STATUSES)[number], DbEnums['game_status']>>(true)
assertExact<Exact<(typeof PREDICTION_PICKS)[number], DbEnums['prediction_pick']>>(true)
assertExact<Exact<(typeof PREDICTION_RESULTS)[number], DbEnums['prediction_result']>>(true)
assertExact<Exact<(typeof POINT_REASONS)[number], DbEnums['point_reason']>>(true)

/** DB 행 타입 바로쓰기 — 쿼리 결과를 다룰 때 사용 */
export type Tables = Database['public']['Tables']
export type Row<T extends keyof Tables> = Tables[T]['Row']
export type InsertRow<T extends keyof Tables> = Tables[T]['Insert']
export type UpdateRow<T extends keyof Tables> = Tables[T]['Update']
