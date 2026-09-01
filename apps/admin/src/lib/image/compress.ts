/**
 * 브라우저 canvas 이미지 압축.
 *
 * 왜 클라이언트에서 압축하나:
 * - Supabase 의 이미지 변환(on-the-fly resize/quality)은 **Pro 플랜 전용**이다.
 *   Free 에서는 업로드 시점에 줄여야 한다.
 * - 카드 150장을 AI 생성 원본 PNG(장당 2~4MB)로 올리면 300~600MB 로
 *   Free Storage 1GB 의 절반을 넘긴다. WebP 압축이면 23~45MB 다.
 * - 원본을 아예 전송하지 않으므로 업로드 시간도 짧아진다(일괄 50장 업로드에서 체감된다).
 *
 * ⚠️ 압축본만 저장한다. AI 생성 원본은 로컬에 보관해야 다시 만들 수 있다.
 */

export interface CompressOptions {
  /** 긴 변 최대 길이(px). 이보다 작은 이미지는 확대하지 않는다 */
  readonly maxEdge: number
  /** WebP 품질 0~1 */
  readonly quality: number
}

/** 카드 통이미지 — 세로 3:4 기준이라 긴 변 1200px 이면 900×1200 이 된다 */
export const CARD_IMAGE_OPTIONS: CompressOptions = { maxEdge: 1200, quality: 0.85 }

/** 구단 로고 — 목록·배지에서 작게 쓰이므로 256px 로 충분하다 */
export const TEAM_LOGO_OPTIONS: CompressOptions = { maxEdge: 256, quality: 0.9 }

export interface CompressedImage {
  readonly blob: Blob
  /** 미리보기용 object URL. 사용 후 revokeObjectURL 로 해제할 것 */
  readonly previewUrl: string
  readonly width: number
  readonly height: number
  readonly originalBytes: number
  readonly compressedBytes: number
}

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('이미지를 읽지 못했습니다'))
    }
    image.src = objectUrl
  })

/** 긴 변을 maxEdge 로 맞춘 크기. 원본이 더 작으면 그대로 둔다(확대하면 화질만 나빠진다) */
const fitSize = (
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } => {
  const longest = Math.max(width, height)
  if (longest <= maxEdge) return { width, height }

  const ratio = maxEdge / longest
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) }
}

/**
 * 이미지를 WebP 로 리사이즈·압축한다.
 * 압축 결과가 원본보다 크면(이미 최적화된 작은 이미지 등) 원본을 그대로 쓴다.
 */
export const compressImage = async (
  file: File,
  options: CompressOptions,
): Promise<CompressedImage> => {
  const image = await loadImage(file)
  const size = fitSize(image.naturalWidth, image.naturalHeight, options.maxEdge)

  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height

  const context = canvas.getContext('2d')
  if (context === null) throw new Error('캔버스를 초기화하지 못했습니다')

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, size.width, size.height)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', options.quality)
  })

  if (blob === null) throw new Error('이미지 압축에 실패했습니다')

  // 압축이 역효과면 원본을 쓴다
  const useOriginal = blob.size >= file.size
  const finalBlob = useOriginal ? file : blob

  return {
    blob: finalBlob,
    previewUrl: URL.createObjectURL(finalBlob),
    width: useOriginal ? image.naturalWidth : size.width,
    height: useOriginal ? image.naturalHeight : size.height,
    originalBytes: file.size,
    compressedBytes: finalBlob.size,
  }
}

/** 사람이 읽는 크기 표기 */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${String(bytes)}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

/** 압축률(%) — 얼마나 줄었는지 */
export const compressionRatio = (image: CompressedImage): number =>
  image.originalBytes === 0 ? 0 : (1 - image.compressedBytes / image.originalBytes) * 100
