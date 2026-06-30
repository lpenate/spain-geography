import { describe, expect, it } from 'vitest'
import {
  availableQuizCategories,
  pageHeaderContext,
  quizNavLabel,
  quizPlayRoute,
} from '@/utils/quizNav'

describe('quizNav', () => {
  it('lists Spain and Europe categories when Europe is enabled', () => {
    expect(availableQuizCategories().map((category) => category.id)).toEqual([
      'comunidades',
      'provincias',
      'paises',
      'paises-ubicacion',
    ])
  })

  it('uses short labels for the header', () => {
    const categories = availableQuizCategories()

    expect(quizNavLabel(categories[0])).toBe('Comunidades')
    expect(quizNavLabel(categories[1])).toBe('Provincias')
    expect(quizNavLabel(categories[2])).toBe('Países EU')
    expect(quizNavLabel(categories[3])).toBe('Ubicación EU')
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
      title: 'Quiz de geografía de España y Europa',
    })

    expect(pageHeaderContext('quiz-play', 'provincias')).toEqual({
      eyebrow: 'España',
      title: 'Provincias',
    })

    expect(pageHeaderContext('quiz-play', 'paises')).toEqual({
      eyebrow: 'Europa',
      title: 'Países de Europa',
    })

    expect(pageHeaderContext('quiz-play', 'paises-ubicacion')).toEqual({
      eyebrow: 'Europa',
      title: 'Ubicación en Europa',
    })
  })
})
