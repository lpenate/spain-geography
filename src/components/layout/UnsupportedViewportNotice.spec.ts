import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import UnsupportedViewportNotice from '@/components/layout/UnsupportedViewportNotice.vue'
import { MIN_SUPPORTED_WIDTH } from '@/composables/useViewport'

describe('UnsupportedViewportNotice', () => {
  it('muestra el mensaje y el ancho mínimo recomendado', () => {
    const wrapper = mount(UnsupportedViewportNotice)

    expect(wrapper.text()).toContain('Pantalla demasiado pequeña')
    expect(wrapper.text()).toContain('ordenador')
    expect(wrapper.text()).toContain('tablet')
    expect(wrapper.text()).toContain(`${MIN_SUPPORTED_WIDTH}`)
    expect(wrapper.attributes('role')).toBe('status')
  })
})
