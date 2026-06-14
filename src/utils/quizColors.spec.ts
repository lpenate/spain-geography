import { describe, expect, it } from 'vitest'
import { assignQuizItemColors } from '@/utils/quizColors'

describe('quizColors', () => {
  it('asigna un color a cada elemento oculto', () => {
    const colors = assignQuizItemColors(['a', 'b', 'c'])

    expect(Object.keys(colors)).toEqual(['a', 'b', 'c'])
    expect(colors.a).toMatch(/^#[0-9a-f]{6}$/i)
    expect(colors.b).toMatch(/^#[0-9a-f]{6}$/i)
    expect(colors.c).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
