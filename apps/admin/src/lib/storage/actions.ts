'use server'

import { createClient } from '@/lib/supabase/server'
import { BUCKETS, BUCKET_SIZE_LIMIT, objectPath, type BucketName } from './buckets'

/**
 * Storage 업로드 서버 액션.
 *
 * 클라이언트가 canvas 로 압축한 Blob 을 FormData 로 보내고, 여기서 Storage 에 올린다.
 * 쿠키 클라이언트를 쓰므로 storage.objects 정책(`is_admin()`)이 그대로 적용된다 —
 * 운영자가 아니면 DB 가 막는다.
 *
 * 반환하는 공개 URL 을 그대로 cards.image_url / teams.logo_url 에 저장한다.
 */

export interface UploadResult {
  readonly ok: boolean
  readonly message: string
  /** 성공 시 공개 URL */
  readonly url?: string
}

const ALLOWED_TYPES = new Set(['image/webp', 'image/png', 'image/jpeg'])

const upload = async (bucket: BucketName, prefix: string, file: File): Promise<UploadResult> => {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, message: 'PNG·JPEG·WebP 이미지만 올릴 수 있습니다' }
  }

  const limit = BUCKET_SIZE_LIMIT[bucket]
  if (file.size > limit) {
    return {
      ok: false,
      message: `${String(Math.round(limit / 1024 / 1024))}MB 이하만 올릴 수 있습니다`,
    }
  }

  try {
    const supabase = await createClient()
    const extension =
      file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg'
    const path = objectPath(prefix, extension)

    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type,
      // 경로에 난수가 붙어 충돌이 없다. 덮어쓰면 CDN 캐시 때문에 이전 이미지가 남을 수 있어 끈다
      upsert: false,
    })

    if (error !== null) {
      console.error('Storage 업로드 실패:', error)
      return { ok: false, message: `업로드 실패: ${error.message}` }
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return { ok: true, message: '업로드 완료', url: data.publicUrl }
  } catch (error) {
    console.error('Storage 업로드 실패:', error)
    return { ok: false, message: '업로드 처리 중 문제가 발생했습니다' }
  }
}

/** 카드 통이미지 업로드 */
export const uploadCardImage = async (formData: FormData): Promise<UploadResult> => {
  const file = formData.get('file')
  if (!(file instanceof File)) return { ok: false, message: '파일이 없습니다' }

  return upload(BUCKETS.cards, 'card', file)
}

/** 구단 로고 업로드 */
export const uploadTeamLogo = async (formData: FormData): Promise<UploadResult> => {
  const file = formData.get('file')
  if (!(file instanceof File)) return { ok: false, message: '파일이 없습니다' }

  const teamId = formData.get('teamId')
  const prefix = typeof teamId === 'string' && teamId !== '' ? `team-${teamId}` : 'team'

  return upload(BUCKETS.teamLogos, prefix, file)
}
