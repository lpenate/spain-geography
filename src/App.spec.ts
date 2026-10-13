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
  it('renderiza la cabecera de navegación en viewports soportados', async () => {
    await router.push('/')
    await router.isReady()

    const wrapper = mountApp()

    expect(wrapper.text()).toContain('Geografía Interactiva')
    expect(wrapper.text()).toContain('Comunidades')
    expect(wrapper.text()).toContain('Provincias')
    expect(wrapper.text()).toContain('Gentilicios')
    expect(wrapper.text()).toContain('Países EU')
    expect(wrapper.text()).toContain('Ubicación EU')
    expect(wrapper.find('.app-shell').exists()).toBe(true)
  })

  it('permite el inicio aunque la ventana sea estrecha', async () => {
    setViewportWidth(MIN_SUPPORTED_WIDTH - 1)
    await router.push('/')
    await router.isReady()

    const wrapper = mountApp()

    expect(wrapper.find('.app-shell').exists()).toBe(true)
    expect(wrapper.text()).toContain('Gentilicios')
    expect(wrapper.text()).not.toContain('Ventana demasiado estrecha')
  })

  it('bloquea solo los quizzes con mapa en ventanas estrechas', async () => {
    setViewportWidth(MIN_SUPPORTED_WIDTH - 1)
    await router.push('/quiz/comunidades')
    await router.isReady()

    const wrapper = mountApp()

    expect(wrapper.text()).toContain('Ventana demasiado estrecha')
    expect(wrapper.text()).toContain(`${MIN_SUPPORTED_WIDTH}`)
    expect(wrapper.text()).toContain('Practicar gentilicios')
    expect(wrapper.find('.app-shell').exists()).toBe(false)
  })

  it('permite el ejercicio de gentilicios en viewport vertical estrecho', async () => {
    setViewportWidth(390)
    await router.push('/quiz/gentilicios')
    await router.isReady()

    const wrapper = mountApp()

    expect(wrapper.find('.app-shell').exists()).toBe(true)
    expect(wrapper.text()).toContain('Gentilicios')
    expect(wrapper.text()).not.toContain('Ventana demasiado estrecha')
    expect(wrapper.text()).not.toContain('Comunidades')
    expect(wrapper.text()).not.toContain('Países EU')
  })
})
