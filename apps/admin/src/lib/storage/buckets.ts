/**
 * Storage 버킷 정의. 마이그레이션(20260831000002_storage_buckets.sql)과 같은 값이어야 한다.
 * 두 버킷 모두 public read 라서 공개 URL 을 그대로 DB 에 저장한다(서명 URL 발급이 필요 없다).
 */

export const BUCKETS = {
  cards: 'cards',
  teamLogos: 'team-logos',
} as const

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS]

/** 버킷별 서버측 크기 제한. 마이그레이션의 file_size_limit 과 동일 */
export const BUCKET_SIZE_LIMIT: Record<BucketName, number> = {
  [BUCKETS.cards]: 5 * 1024 * 1024,
  [BUCKETS.teamLogos]: 1024 * 1024,
} as const

/**
 * 업로드 경로. 같은 이름으로 다시 올려도 덮어쓰지 않도록 난수 접미어를 붙인다.
 * 덮어쓰면 CDN 캐시가 남아 이전 이미지가 계속 보일 수 있다.
 */
export const objectPath = (prefix: string, extension = 'webp'): string =>
  `${prefix}-${crypto.randomUUID()}.${extension}`
