import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import { useViewport } from '@/composables/useViewport'

describe('useViewport', () => {
  it('detecta móvil por ancho de pantalla', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 })

    const TestComponent = defineComponent({
      setup() {
        return useViewport()
      },
      template: '<div />',
    })

    const wrapper = mount(TestComponent)

    expect(wrapper.vm.isMobile).toBe(true)
    expect(wrapper.vm.isTablet).toBe(false)
    expect(wrapper.vm.isDesktop).toBe(false)
  })
})
