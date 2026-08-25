import { describe, expect, it } from 'vitest'
import {
  GAME_STATUSES,
  GAME_STATUS_LABEL,
  PREDICTION_RESULTS,
  PREDICTION_RESULT_LABEL,
  PREDICT_CLOSE_OFFSET_MINUTES,
  isGameSettled,
  isPredictOpen,
} from './game'

const MINUTE = 60 * 1000

describe('isPredictOpen', () => {
  const closeAt = new Date('2026-08-25T09:30:00.000Z')

  it('서버 시각이 마감 전이면 열려 있다', () => {
    expect(isPredictOpen(closeAt, new Date(closeAt.getTime() - MINUTE))).toBe(true)
  })

  it('마감 시각과 같으면 닫힌다', () => {
    expect(isPredictOpen(closeAt, closeAt)).toBe(false)
  })

  it('마감 후면 닫힌다', () => {
    expect(isPredictOpen(closeAt, new Date(closeAt.getTime() + MINUTE))).toBe(false)
  })
})

describe('isGameSettled', () => {
  it('settled만 true', () => {
    for (const status of GAME_STATUSES) {
      expect(isGameSettled(status)).toBe(status === 'settled')
    }
  })
})

describe('상태 라벨', () => {
  it('모든 경기 상태에 라벨이 있다', () => {
    for (const status of GAME_STATUSES) {
      expect(GAME_STATUS_LABEL[status]).toBeTruthy()
    }
  })

  it('모든 예측 결과에 라벨이 있다', () => {
    for (const result of PREDICTION_RESULTS) {
      expect(PREDICTION_RESULT_LABEL[result]).toBeTruthy()
    }
  })
})

describe('예측 마감 오프셋', () => {
  it('경기 시작 1시간 전이다', () => {
    expect(PREDICT_CLOSE_OFFSET_MINUTES).toBe(60)
  })
})
