import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useUserId } from './useSession'

/**
 * 내 프로필 — `users` 행.
 *
 * 앱은 anon key 로 붙으므로 **RLS 가 유일한 방어선**이다. `users_select_own_or_admin` 이
 * 본인 행만 내주지만, 그래도 `eq('id', userId)` 를 명시한다 — 정책에만 의존하면 정책이
 * 바뀌었을 때 조용히 다른 행이 섞인다.
 *
 * ## 이 훅이 온보딩 진입을 결정한다
 *
 * `nickname` 이 null 이면 온보딩으로 보낸다(앱기획서 3.1). 가입 트리거가 `nickname` 없는
 * 행을 만들어 두므로, **행은 있는데 닉네임만 없는** 상태가 정상이다.
 *
 * ⚠️ 응원팀 이름·색은 여기서 조인하지 않는다. PostgREST 관계명 추론이 뷰가 늘어날 때마다
 *    흔들려서 어드민에서 실제로 겪었다(`repositories/supabase.ts` 의 `one()` 주석).
 *    화면이 필요하면 `teams` 를 따로 조회해 붙인다.
 */
export interface MyProfile {
  readonly id: string
  /** 온보딩을 마치지 않았으면 null */
  readonly nickname: string | null
  readonly favoriteTeamId: number | null
  readonly points: number
}

export const myProfileKey = (userId: string | null) => ['my-profile', userId] as const

export const useMyProfile = () => {
  const userId = useUserId()

  return useQuery({
    queryKey: myProfileKey(userId),
    // 로그인 전에는 조회할 것이 없다(anon 에는 테이블 권한이 없다)
    enabled: userId !== null,
    queryFn: async (): Promise<MyProfile> => {
      if (userId === null) throw new Error('로그인이 필요합니다')

      const { data, error } = await supabase
        .from('users')
        .select('id, nickname, favorite_team_id, points')
        .eq('id', userId)
        .maybeSingle()

      if (error !== null) throw new Error(`프로필을 불러오지 못했습니다: ${error.message}`)
      // 가입 트리거가 행을 만든다. 없다면 트리거가 실패한 것이므로 조용히 넘기지 않는다.
      if (data === null) throw new Error('프로필이 없습니다. 다시 로그인해 주세요.')

      return {
        id: data.id,
        nickname: data.nickname,
        favoriteTeamId: data.favorite_team_id,
        points: data.points,
      }
    },
  })
}

export interface ProfileUpdateInput {
  readonly nickname?: string
  readonly favoriteTeamId?: number | null
}

/**
 * 닉네임·응원팀 저장 — 온보딩과 설정이 같은 mutation 을 쓴다.
 *
 * DB 는 **컬럼 단위 grant** 로 이 둘만 수정하게 막아 두었다
 * (`grant update (nickname, favorite_team_id) ... to authenticated`).
 * 포인트를 여기서 바꾸려 해도 서버가 거부한다.
 *
 * ⚠️ **unique 위반(23505)을 반드시 처리한다.** `is_nickname_available` 로 확인한 뒤에도
 *    저장 순간 다른 사람이 같은 닉네임을 쓸 수 있다(앱기획서 3.1). 확인만 믿으면 저장이
 *    조용히 실패한다.
 */
export const NICKNAME_CONFLICT = '이미 사용 중인 닉네임입니다'

export const useUpdateProfile = () => {
  const userId = useUserId()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ProfileUpdateInput): Promise<void> => {
      if (userId === null) throw new Error('로그인이 필요합니다')

      const patch: { nickname?: string; favorite_team_id?: number | null } = {}
      if (input.nickname !== undefined) patch.nickname = input.nickname
      if (input.favoriteTeamId !== undefined) patch.favorite_team_id = input.favoriteTeamId

      const { error } = await supabase.from('users').update(patch).eq('id', userId)

      if (error !== null) {
        if (error.code === '23505') throw new Error(NICKNAME_CONFLICT)
        throw new Error(`저장하지 못했습니다: ${error.message}`)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: myProfileKey(userId) })
    },
  })
}

/**
 * 닉네임 사용 가능 여부 — `is_nickname_available` RPC.
 *
 * 형식 검증은 하지 않는다(RPC 주석). 형식은 `lib/nickname` 이 즉시, **중복은 저장할 때**
 * 이 함수로 확인한다 — 한 글자마다 서버를 부르면 낭비다.
 */
export const isNicknameAvailable = async (candidate: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('is_nickname_available', { candidate })

  if (error !== null) throw new Error(`닉네임을 확인하지 못했습니다: ${error.message}`)

  return data
}
