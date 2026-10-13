import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import UnsupportedViewportNotice from '@/components/layout/UnsupportedViewportNotice.vue'
import { MIN_SUPPORTED_WIDTH } from '@/composables/useViewport'
import router from '@/router'

describe('UnsupportedViewportNotice', () => {
  it('muestra el mensaje, el ancho mínimo y el acceso a gentilicios', async () => {
    await router.push('/')
    await router.isReady()

    const wrapper = mount(UnsupportedViewportNotice, {
      global: {
        plugins: [createPinia(), router],
      },
    })

    expect(wrapper.text()).toContain('Pantalla demasiado pequeña')
    expect(wrapper.text()).toContain('mapa')
    expect(wrapper.text()).toContain(`${MIN_SUPPORTED_WIDTH}`)
    expect(wrapper.text()).toContain('Practicar gentilicios')
    expect(wrapper.text()).toContain('vertical')
    expect(wrapper.attributes('role')).toBe('status')
  })
})
