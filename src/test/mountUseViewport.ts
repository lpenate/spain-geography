import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { useViewport } from '@/composables/useViewport'

const ViewportProbe = defineComponent({
  name: 'ViewportProbe',
  setup() {
    return useViewport()
  },
  template: '<div />',
})

export function mountUseViewport() {
  return mount(ViewportProbe)
}
