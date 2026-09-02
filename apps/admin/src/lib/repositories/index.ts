import type { AdminRepositories } from './types'
import { supabaseRepositories } from './supabase'

/**
 * 화면이 쓰는 단일 진입점.
 *
 * 4단계에서 in-memory(fixture) → Supabase 구현으로 교체했다.
 * 화면 코드는 한 줄도 수정하지 않았다 — 이 경계를 둔 목적이 그것이다.
 */
export const repositories: AdminRepositories = supabaseRepositories

export * from './types'
