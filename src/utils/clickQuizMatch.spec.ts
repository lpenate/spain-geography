import { describe, expect, it } from 'vitest'
import { isClickQuizAnswerCorrect, isMicrostateSvgPathId } from '@/utils/clickQuizMatch'

describe('clickQuizMatch', () => {
  it('identifies configured microstates', () => {
    expect(isMicrostateSvgPathId('monaco')).toBe(true)
    expect(isMicrostateSvgPathId('francia')).toBe(false)
  })

  it('accepts exact path matches', () => {
    expect(isClickQuizAnswerCorrect('monaco', 'monaco')).toBe(true)
  })

  it('accepts host countries for microstates', () => {
    expect(isClickQuizAnswerCorrect('andorra', 'espana')).toBe(true)
    expect(isClickQuizAnswerCorrect('andorra', 'francia')).toBe(true)
    expect(isClickQuizAnswerCorrect('liechtenstein', 'suiza')).toBe(true)
    expect(isClickQuizAnswerCorrect('liechtenstein', 'austria')).toBe(true)
    expect(isClickQuizAnswerCorrect('ciudad-del-vaticano', 'italia')).toBe(true)
    expect(isClickQuizAnswerCorrect('monaco', 'francia')).toBe(true)
  })

  it('does not accept host clicks when the target is the host country', () => {
    expect(isClickQuizAnswerCorrect('francia', 'monaco')).toBe(false)
    expect(isClickQuizAnswerCorrect('italia', 'ciudad-del-vaticano')).toBe(false)
  })

  it('rejects unrelated countries', () => {
    expect(isClickQuizAnswerCorrect('monaco', 'italia')).toBe(false)
    expect(isClickQuizAnswerCorrect('andorra', 'portugal')).toBe(false)
  })
})
