import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import App from '@/App.vue'
import router from '@/router'

describe('App', () => {
  it('renderiza la cabecera de navegación', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router],
      },
    })

    expect(wrapper.text()).toContain('Geografía Interactiva')
    expect(wrapper.text()).toContain('España')
    expect(wrapper.text()).toContain('Europa')
  })
})
