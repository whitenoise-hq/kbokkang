import type { AdminRepositories } from './types'
import { inMemoryRepositories } from './in-memory'

/**
 * 화면이 쓰는 단일 진입점.
 * 스키마 확정(3단계) 후 여기서 `supabaseRepositories`로 바꾸면 화면은 수정하지 않는다.
 */
export const repositories: AdminRepositories = inMemoryRepositories

export * from './types'
