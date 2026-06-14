<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
</script>

<template>
  <div class="app-shell">
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
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: var(--space-page-y) var(--space-page-x) var(--space-page-bottom);
}

@media (min-width: 640px) {
  .app-main {
    padding-top: 1.5rem;
    padding-bottom: 2.5rem;
  }
}

@media (min-width: 1024px) {
  .app-main {
    padding-top: 2rem;
    padding-bottom: 3rem;
  }
}
</style>
