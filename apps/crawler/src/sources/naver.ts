import { z } from 'zod'
import {
  isRegularSeasonGame,
  type NaverTeamCode,
  NAVER_TEAM_CODES,
} from '@kbokkang/shared'
import { kstDateTimeToUtcIso } from '../date'

/**
 * 네이버 스포츠 경기 일정/결과 소스.
 *
 * 소스 의존을 이 파일 하나에 격리한다. 다른 소스로 갈아탈 때 이 파일만 교체하면 된다.
 *
 * ⚠️ 문서화된 공개 API 가 아니다. 응답 구조가 예고 없이 바뀔 수 있으므로 zod 로 검증하고,
 * 어긋나면 **조용히 틀린 값을 쓰지 말고 실패**시킨다(스코어가 전부 0으로 들어가는 것보다 낫다).
 */

const BASE_URL = 'https://api-gw.sports.naver.com/schedule/games'

/** 응답 스키마 — 실제 2026 시즌 843경기 표본으로 확인한 필드만 받는다 */
const gameSchema = z.object({
  gameId: z.string().min(1),
  categoryId: z.string(),
  gameDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** 타임존 표기가 없다. KST 로 해석해야 한다 */
  gameDateTime: z.string().min(1),
  homeTeamCode: z.string(),
  awayTeamCode: z.string(),
  homeTeamScore: z.number().int(),
  awayTeamScore: z.number().int(),
  /** BEFORE / RESULT 두 가지만 관찰됨 */
  statusCode: z.string(),
  /** '경기전' '9회말' '경기취소' 등. 진행 중 판정에 쓴다 */
  statusInfo: z.string(),
  cancel: z.boolean(),
  suspended: z.boolean(),
})

const responseSchema = z.object({
  success: z.literal(true),
  result: z.object({ games: z.array(gameSchema) }),
})

/** 소스 응답을 우리가 쓰는 형태로 정규화한 것 */
export interface SourceGame {
  /** `games.external_id` — 재수집 시 upsert 키 */
  readonly externalId: string
  readonly gameDate: string
  /** UTC ISO */
  readonly startAt: string
  readonly homeTeamShortName: string
  readonly awayTeamShortName: string
  readonly homeScore: number
  readonly awayScore: number
  readonly statusCode: string
  readonly statusInfo: string
  readonly cancel: boolean
  readonly suspended: boolean
}

export class SourceError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'SourceError'
  }
}

/**
 * 기간 내 KBO 정규시즌 경기를 가져온다.
 *
 * `categoryId=kbo` 로도 올스타전이 함께 내려오므로(팀 코드 EA 드림 / WE 나눔)
 * 10개 구단 화이트리스트로 한 번 더 걸러낸다.
 */
export const fetchGames = async (fromDate: string, toDate: string): Promise<readonly SourceGame[]> => {
  const url = `${BASE_URL}?upperCategoryId=kbaseball&fromDate=${fromDate}&toDate=${toDate}&size=500`

  let payload: unknown
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'kbokkang-crawler/1.0 (+https://github.com/whitenoise-hq/kbokkang)' },
      signal: AbortSignal.timeout(20_000),
    })

    if (!response.ok) {
      throw new SourceError(`소스 응답 상태 ${String(response.status)}`)
    }

    payload = await response.json()
  } catch (cause) {
    if (cause instanceof SourceError) throw cause
    throw new SourceError('소스 요청에 실패했습니다', { cause })
  }

  const parsed = responseSchema.safeParse(payload)
  if (!parsed.success) {
    // 구조가 바뀌었다. 추측해서 채우지 말고 실패로 남긴다.
    throw new SourceError(
      `소스 응답 구조가 예상과 다릅니다: ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`,
    )
  }

  return parsed.data.result.games
    .filter((game) => game.categoryId === 'kbo')
    .filter((game) => isRegularSeasonGame(game.homeTeamCode, game.awayTeamCode))
    .map((game) => ({
      externalId: game.gameId,
      gameDate: game.gameDate,
      startAt: kstDateTimeToUtcIso(game.gameDateTime),
      homeTeamShortName: NAVER_TEAM_CODES[game.homeTeamCode as NaverTeamCode],
      awayTeamShortName: NAVER_TEAM_CODES[game.awayTeamCode as NaverTeamCode],
      homeScore: game.homeTeamScore,
      awayScore: game.awayTeamScore,
      statusCode: game.statusCode,
      statusInfo: game.statusInfo,
      cancel: game.cancel,
      suspended: game.suspended,
    }))
}
