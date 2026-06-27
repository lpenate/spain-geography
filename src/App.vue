<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import UnsupportedViewportNotice from '@/components/layout/UnsupportedViewportNotice.vue'
import { useViewport } from '@/composables/useViewport'

const { isSupportedViewport } = useViewport()
</script>

<template>
  <UnsupportedViewportNotice v-if="!isSupportedViewport" />
  <div v-else class="app-shell">
    <AppHeader />
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100svh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  isolation: isolate;
}

.app-main {
  position: relative;
  z-index: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: min(1200px, 100%);
  margin: 0 auto;
  padding: 1.5rem var(--space-page-x) 2.5rem;
}

@media (min-width: 1024px) {
  .app-main {
    padding-top: 2rem;
    padding-bottom: 3rem;
  }
}
</style>
