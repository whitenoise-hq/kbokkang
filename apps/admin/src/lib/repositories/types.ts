import type {
  Card,
  CardFilter,
  CardInput,
  CardSpreadRow,
  DashboardSummary,
  DrawStats,
  Game,
  GameFilter,
  GameWithStats,
  PointFlowPoint,
  PointTransaction,
  Prediction,
  Team,
  UserDetail,
  UserSummary,
} from '@kbokkang/shared'
import type { CardGrade } from '@kbokkang/shared'

/**
 * 데이터 접근 경계. 화면은 이 인터페이스만 의존한다.
 * 지금은 fixture 기반 in-memory 구현이고, 스키마 확정(3단계) 후
 * Supabase 구현으로 교체하면 화면 코드는 수정하지 않는다.
 */

export interface Paged<T> {
  readonly items: readonly T[]
  readonly total: number
  readonly page: number
  readonly pageSize: number
}

export interface PageRequest {
  readonly page: number
  readonly pageSize: number
}

export const DEFAULT_PAGE_SIZE = 20

export interface CardRepository {
  list(filter: CardFilter, page: PageRequest): Promise<Paged<Card>>
  findById(id: string): Promise<Card | null>
  /** 도감번호 자동 부여용 — 해당 등급의 기존 카드 수(삭제분 포함) */
  countByGrade(grade: CardGrade): Promise<number>
  create(input: CardInput): Promise<Card>
  /** 일괄 등록. 전부 성공하거나 전부 롤백된다(중간 실패 시 도감번호에 구멍이 생기면 안 된다) */
  createMany(inputs: readonly CardInput[]): Promise<readonly Card[]>
  update(id: string, input: CardInput): Promise<Card>
  /** soft delete. 보유자가 있으면 하드 삭제하지 않는다 */
  softDelete(id: string): Promise<void>
  restore(id: string): Promise<void>
}

export interface TeamRepository {
  list(): Promise<readonly Team[]>
  findById(id: number): Promise<Team | null>
  update(id: number, patch: Pick<Team, 'name' | 'shortName' | 'color' | 'logoUrl'>): Promise<Team>
}

export interface UserRepository {
  list(keyword: string, page: PageRequest): Promise<Paged<UserSummary>>
  findDetail(id: string): Promise<UserDetail | null>
  /** 포인트 수동 지급/차감. reason=admin_adjust 로 기록된다 */
  adjustPoints(id: string, amount: number, memo: string): Promise<PointTransaction>
}

export interface GameRepository {
  list(filter: GameFilter, page: PageRequest): Promise<Paged<GameWithStats>>
  findById(id: string): Promise<Game | null>
  predictionsOf(gameId: string): Promise<readonly Prediction[]>
  /** 수동 정산 — 크롤링 실패 시 운영자가 결과 입력 */
  settle(id: string, homeScore: number, awayScore: number): Promise<Game>
}

export interface StatsRepository {
  dashboard(): Promise<DashboardSummary>
  drawStats(): Promise<readonly DrawStats[]>
  cardSpread(): Promise<readonly CardSpreadRow[]>
  pointFlow(days: number): Promise<readonly PointFlowPoint[]>
}

export interface AdminRepositories {
  readonly cards: CardRepository
  readonly teams: TeamRepository
  readonly users: UserRepository
  readonly games: GameRepository
  readonly stats: StatsRepository
}
