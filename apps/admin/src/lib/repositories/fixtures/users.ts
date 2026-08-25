import type { CardGrade, DrawLog, OwnedCard, PointTransaction, UserDetail } from '@kbokkang/shared'
import { CARD_GRADES, duplicateRefundOf } from '@kbokkang/shared'
import { CARD_FIXTURES } from './cards'

/**
 * 유저 fixture. 목록·상세 화면(뽑기 이력·포인트 내역·도감 진행률) 검증용.
 * 포인트가 0인 유저, 도감을 거의 못 채운 유저 등 경계 케이스를 포함한다.
 */

interface UserSeed {
  readonly id: string
  readonly nickname: string
  readonly favoriteTeamId: number | null
  readonly points: number
  /** 보유 카드 종수 — 앞에서부터 이 개수만큼 보유한 것으로 만든다 */
  readonly ownedKinds: number
  readonly createdAt: string
}

const SEEDS: readonly UserSeed[] = [
  {
    id: 'user-0001',
    nickname: '크보덕후',
    favoriteTeamId: 1,
    points: 1240,
    ownedKinds: 21,
    createdAt: '2026-03-02T04:20:00.000Z',
  },
  {
    id: 'user-0002',
    nickname: '홈런왕',
    favoriteTeamId: 3,
    points: 380,
    ownedKinds: 14,
    createdAt: '2026-03-15T11:02:00.000Z',
  },
  {
    id: 'user-0003',
    nickname: '직관러',
    favoriteTeamId: 7,
    points: 0,
    ownedKinds: 9,
    createdAt: '2026-04-01T02:44:00.000Z',
  },
  {
    id: 'user-0004',
    nickname: '삼진머신',
    favoriteTeamId: 2,
    points: 2850,
    ownedKinds: 26,
    createdAt: '2026-04-11T13:31:00.000Z',
  },
  {
    id: 'user-0005',
    nickname: '만년꼴찌팬',
    favoriteTeamId: 10,
    points: 95,
    ownedKinds: 4,
    createdAt: '2026-05-06T07:15:00.000Z',
  },
  {
    id: 'user-0006',
    nickname: '가을야구가자',
    favoriteTeamId: 8,
    points: 610,
    ownedKinds: 17,
    createdAt: '2026-05-22T22:09:00.000Z',
  },
  {
    id: 'user-0007',
    nickname: '응원단장',
    favoriteTeamId: 6,
    points: 175,
    ownedKinds: 11,
    createdAt: '2026-06-03T05:50:00.000Z',
  },
  {
    id: 'user-0008',
    nickname: '뉴비입니다',
    favoriteTeamId: null,
    points: 200,
    ownedKinds: 1,
    createdAt: '2026-08-24T23:40:00.000Z',
  },
  {
    id: 'user-0009',
    nickname: '카드수집가',
    favoriteTeamId: 4,
    points: 4320,
    ownedKinds: 24,
    createdAt: '2026-03-09T08:00:00.000Z',
  },
  {
    id: 'user-0010',
    nickname: '예측장인',
    favoriteTeamId: 9,
    points: 1875,
    ownedKinds: 19,
    createdAt: '2026-04-27T10:25:00.000Z',
  },
]

const ACTIVE_CARDS = CARD_FIXTURES.filter((card) => card.deletedAt === null)

/** 등급별 전체 카드 수(도감 진행률 분모) */
const totalByGrade = (grade: CardGrade): number =>
  ACTIVE_CARDS.filter((card) => card.grade === grade).length

const buildOwnedCards = (seed: UserSeed): readonly OwnedCard[] =>
  ACTIVE_CARDS.slice(0, seed.ownedKinds).map((card, index) => ({
    cardId: card.id,
    dexNo: card.dexNo,
    name: card.name,
    grade: card.grade,
    // 낮은 등급일수록 중복이 많이 쌓이도록
    count: card.grade === 'normal' ? 1 + (index % 4) : 1 + (index % 2),
    acquiredAt: `2026-0${5 + (index % 4)}-${String(2 + (index % 26)).padStart(2, '0')}T12:00:00.000Z`,
  }))

const buildDraws = (seed: UserSeed): readonly DrawLog[] =>
  ACTIVE_CARDS.slice(0, Math.min(seed.ownedKinds, 12)).map((card, index) => {
    const isDuplicate = index % 3 === 2
    const drawType = index % 4 === 0 ? 'premium' : 'normal'

    return {
      id: `${seed.id}-draw-${String(index + 1).padStart(3, '0')}`,
      drawType,
      cardId: card.id,
      cardDexNo: card.dexNo,
      cardName: card.name,
      cardGrade: card.grade,
      cost: drawType === 'premium' ? 300 : 100,
      isDuplicate,
      refundPoints: isDuplicate ? duplicateRefundOf(card.grade) : 0,
      createdAt: `2026-08-${String(24 - (index % 20)).padStart(2, '0')}T${String(9 + (index % 12)).padStart(2, '0')}:30:00.000Z`,
    }
  })

const buildPointTransactions = (seed: UserSeed): readonly PointTransaction[] => {
  const draws = buildDraws(seed)

  const signup: PointTransaction = {
    id: `${seed.id}-pt-signup`,
    amount: 200,
    reason: 'signup',
    refId: null,
    memo: null,
    createdAt: seed.createdAt,
  }

  const fromDraws = draws.flatMap<PointTransaction>((draw, index) => {
    const spend: PointTransaction = {
      id: `${seed.id}-pt-draw-${index}`,
      amount: -draw.cost,
      reason: 'draw',
      refId: draw.id,
      memo: null,
      createdAt: draw.createdAt,
    }

    if (!draw.isDuplicate) return [spend]

    return [
      spend,
      {
        id: `${seed.id}-pt-refund-${index}`,
        amount: draw.refundPoints,
        reason: 'duplicate_refund',
        refId: draw.id,
        memo: null,
        createdAt: draw.createdAt,
      },
    ]
  })

  const wins = Array.from({ length: 6 }, (_, index): PointTransaction => {
    const isScoreHit = index === 2
    return {
      id: `${seed.id}-pt-win-${index}`,
      amount: isScoreHit ? 150 : 30,
      reason: isScoreHit ? 'predict_score' : 'predict_win',
      refId: null,
      memo: null,
      createdAt: `2026-08-${String(23 - index * 2).padStart(2, '0')}T13:05:00.000Z`,
    }
  })

  return [signup, ...fromDraws, ...wins].toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
}

const buildDetail = (seed: UserSeed): UserDetail => {
  const ownedCards = buildOwnedCards(seed)

  return {
    id: seed.id,
    nickname: seed.nickname,
    favoriteTeamId: seed.favoriteTeamId,
    points: seed.points,
    ownedCardKinds: ownedCards.length,
    createdAt: seed.createdAt,
    dexProgress: CARD_GRADES.map((grade) => ({
      grade,
      owned: ownedCards.filter((card) => card.grade === grade).length,
      total: totalByGrade(grade),
    })),
    ownedCards,
    draws: buildDraws(seed),
    pointTransactions: buildPointTransactions(seed),
    record: {
      totalPredictions: 18 + seed.ownedKinds,
      winHits: 7 + Math.floor(seed.ownedKinds / 2),
      scoreHits: Math.floor(seed.ownedKinds / 8),
      bestStreak: 2 + (seed.ownedKinds % 5),
    },
  }
}

export const USER_FIXTURES: readonly UserDetail[] = SEEDS.map(buildDetail)

/** 도감 전체 종수(진행률 분모) */
export const TOTAL_CARD_KINDS = ACTIVE_CARDS.length
