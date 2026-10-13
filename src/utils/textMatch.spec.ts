import { describe, expect, it } from 'vitest'
import { isApproximateMatch, isCloseMatch, normalizeAnswer } from '@/utils/textMatch'

describe('textMatch', () => {
  it('normaliza mayúsculas y acentos', () => {
    expect(normalizeAnswer('  Córdoba ')).toBe('cordoba')
  })

  it('acepta coincidencias aproximadas', () => {
    expect(isApproximateMatch('sevilla', ['Sevilla'])).toBe(true)
    expect(isApproximateMatch('sevila', ['Sevilla'])).toBe(true)
    expect(isApproximateMatch('pais vasco', ['País Vasco', 'Euskadi'])).toBe(true)
  })

  it('rechaza respuestas claramente incorrectas', () => {
    expect(isApproximateMatch('barcelona', ['Sevilla'])).toBe(false)
  })

  it('acepta erratas sin confundir lugares parecidos ni nombres contenidos', () => {
    expect(isCloseMatch('sevila', ['Sevilla'])).toBe(true)
    expect(isCloseMatch('Palencia', ['Valencia'])).toBe(false)
    expect(isCloseMatch('Valencia', ['Palencia'])).toBe(false)
    expect(isCloseMatch('León', ['Castilla y León'])).toBe(false)
    expect(isCloseMatch('Castilla y León', ['León'])).toBe(false)
    expect(isCloseMatch('   ', ['Madrid'])).toBe(false)
  })
})
