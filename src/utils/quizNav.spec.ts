import { describe, expect, it } from 'vitest'
import {
  availableQuizCategories,
  pageHeaderContext,
  quizNavLabel,
  quizPlayRoute,
} from '@/utils/quizNav'

describe('quizNav', () => {
  it('lists only available Spain categories by default', () => {
    expect(availableQuizCategories().map((category) => category.id)).toEqual([
      'comunidades',
      'provincias',
    ])
  })

  it('uses short labels for the header', () => {
    const categories = availableQuizCategories()

    expect(quizNavLabel(categories[0])).toBe('Comunidades')
    expect(quizNavLabel(categories[1])).toBe('Provincias')
  })

  it('builds named quiz routes for navigation', () => {
    expect(quizPlayRoute('comunidades')).toEqual({
      name: 'quiz-play',
      params: { mode: 'comunidades' },
    })
  })

  it('resolves page header context for home and quiz routes', () => {
    expect(pageHeaderContext('home')).toEqual({
      eyebrow: 'Aprende geografía con mapas interactivos',
      title: 'Quiz de geografía de España',
    })

    expect(pageHeaderContext('quiz-play', 'provincias')).toEqual({
      eyebrow: 'España',
      title: 'Provincias',
    })

    expect(pageHeaderContext('quiz-play', 'comunidades')).toEqual({
      eyebrow: 'España',
      title: 'Comunidades autónomas',
    })
  })
})
