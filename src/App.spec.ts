import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import App from '@/App.vue'
import { MIN_SUPPORTED_WIDTH } from '@/composables/useViewport'
import router from '@/router'
import { setViewportWidth } from '@/test/viewport'

function mountApp() {
  return mount(App, {
    global: {
      plugins: [createPinia(), router],
    },
  })
}

describe('App', () => {
  it('renderiza la cabecera de navegación en viewports soportados', () => {
    const wrapper = mountApp()

    expect(wrapper.text()).toContain('Geografía Interactiva')
    expect(wrapper.text()).toContain('Comunidades')
    expect(wrapper.text()).toContain('Provincias')
    expect(wrapper.text()).toContain('Países EU')
    expect(wrapper.text()).toContain('Ubicación EU')
    expect(wrapper.find('.app-shell').exists()).toBe(true)
  })

  it('muestra aviso cuando el ancho es inferior al mínimo soportado', () => {
    setViewportWidth(MIN_SUPPORTED_WIDTH - 1)

    const wrapper = mountApp()

    expect(wrapper.text()).toContain('Pantalla demasiado pequeña')
    expect(wrapper.text()).toContain(`${MIN_SUPPORTED_WIDTH}`)
    expect(wrapper.text()).not.toContain('Comunidades')
    expect(wrapper.find('.app-shell').exists()).toBe(false)
  })
})
