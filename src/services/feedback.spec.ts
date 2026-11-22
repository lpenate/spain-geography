import { describe, expect, it } from 'vitest'
import { buildFeedbackBody } from '@/services/feedback'

describe('buildFeedbackBody', () => {
  it('envía los cuatro campos del Formulario de Google, recortados', () => {
    const body = buildFeedbackBody({
      who: '  Ana, madre de un alumno ',
      contact: ' ana@example.com ',
      comment: '  Faltan los afluentes del Ebro.  ',
    })

    expect(Object.fromEntries(body)).toEqual({
      'entry.1289958486': 'No',
      'entry.1430570442': 'Ana, madre de un alumno',
      'entry.1678696505': 'ana@example.com',
      'entry.901256983': 'Faltan los afluentes del Ebro.',
    })
  })

  it('nunca marca al remitente como menor: los menores no pueden enviar', () => {
    expect(
      buildFeedbackBody({ who: '', contact: '', comment: 'Hola' }).get('entry.1289958486'),
    ).toBe('No')
  })
})
