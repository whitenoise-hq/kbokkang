import type { Card, CardGrade, CardType } from '@kbokkang/shared'
import { formatDexNo } from '@kbokkang/shared'

/**
 * 카드 fixture. 목표 150장 중 화면 검증용 대표 표본.
 * 등급 × 종류 조합, 이미지 미등록, soft delete, 시즌 카드 등 엣지케이스를 포함한다.
 */

interface CardSeed {
  readonly name: string
  readonly grade: CardGrade
  readonly type: CardType
  readonly drawWeight?: number
  readonly isSeason?: boolean
  readonly noImage?: boolean
  readonly deleted?: boolean
}

const SEEDS: readonly CardSeed[] = [
  // 일반 N — 아이템 위주
  { name: '나무 배트', grade: 'normal', type: 'item', drawWeight: 3 },
  { name: '가죽 글러브', grade: 'normal', type: 'item', drawWeight: 3 },
  { name: '연습용 야구공', grade: 'normal', type: 'item', drawWeight: 5 },
  { name: '타격 헬멧', grade: 'normal', type: 'item' },
  { name: '응원 막대', grade: 'normal', type: 'item' },
  { name: '스포츠 물통', grade: 'normal', type: 'item', noImage: true },
  { name: '신입 타자', grade: 'normal', type: 'player', drawWeight: 2 },
  { name: '연습생 투수', grade: 'normal', type: 'player', drawWeight: 2 },
  { name: '벤치 포수', grade: 'normal', type: 'player' },
  { name: '낡은 야구화', grade: 'normal', type: 'item', deleted: true },

  // 레어 R — 선수 위주
  { name: '교타자 준', grade: 'rare', type: 'player', drawWeight: 2 },
  { name: '좌완 스페셜리스트', grade: 'rare', type: 'player', drawWeight: 2 },
  { name: '도루왕 바람', grade: 'rare', type: 'player' },
  { name: '수호신 마무리', grade: 'rare', type: 'player' },
  { name: '아기 곰 마스코트', grade: 'rare', type: 'mascot' },
  { name: '줄무늬 호랑이', grade: 'rare', type: 'mascot' },
  { name: '반짝이는 글러브', grade: 'rare', type: 'item', noImage: true },

  // 에픽 E
  { name: '홈런 슬러거 태산', grade: 'epic', type: 'player', drawWeight: 2 },
  { name: '무적의 에이스', grade: 'epic', type: 'player' },
  { name: '철벽 유격수', grade: 'epic', type: 'player' },
  { name: '포효하는 사자', grade: 'epic', type: 'mascot' },
  { name: '창단 기념 유니폼', grade: 'epic', type: 'item', isSeason: true },

  // 레전드 L — 풀아트
  { name: '전설의 4번타자', grade: 'legend', type: 'player' },
  { name: '완전투구의 신', grade: 'legend', type: 'player' },
  { name: '황금 독수리', grade: 'legend', type: 'mascot' },
  { name: '가을 야구의 주인공', grade: 'legend', type: 'player', isSeason: true },

  // 신화 M — 풀아트
  { name: '야구의 신', grade: 'mythic', type: 'player' },
  { name: '불멸의 마무리', grade: 'mythic', type: 'player' },
  { name: '태초의 마스코트', grade: 'mythic', type: 'mascot' },
]

/** 등급별 순번을 세어 도감번호를 부여한다 */
const buildFixtures = (): readonly Card[] => {
  const seqByGrade = new Map<CardGrade, number>()

  return SEEDS.map((seed, index) => {
    const seq = (seqByGrade.get(seed.grade) ?? 0) + 1
    seqByGrade.set(seed.grade, seq)

    const dexNo = formatDexNo({ grade: seed.grade, seq })
    // 등록 시각은 도감번호 순서대로 하루씩 앞당겨 배치(정렬 확인용)
    const createdAt = `2026-0${3 + (index % 5)}-${String(1 + (index % 27)).padStart(2, '0')}T09:00:00.000Z`

    return {
      id: `card-${dexNo.toLowerCase()}`,
      dexNo,
      name: seed.name,
      grade: seed.grade,
      type: seed.type,
      imageUrl: seed.noImage === true ? null : `/mock-cards/${dexNo}.png`,
      drawWeight: seed.drawWeight ?? 1,
      isSeason: seed.isSeason ?? false,
      createdAt,
      deletedAt: seed.deleted === true ? '2026-07-14T02:11:00.000Z' : null,
    }
  })
}

export const CARD_FIXTURES: readonly Card[] = buildFixtures()
