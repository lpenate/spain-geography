<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import UnsupportedViewportNotice from '@/components/layout/UnsupportedViewportNotice.vue'
import { useViewport } from '@/composables/useViewport'

const { isSupportedViewport } = useViewport()
const route = useRoute()

const isHomeRoute = computed(() => route.name === 'home')
const isGentiliciosRoute = computed(
  () => route.name === 'quiz-play' && route.params.mode === 'gentilicios',
)
const isMapQuizRoute = computed(
  () => route.name === 'quiz-play' && route.params.mode !== 'gentilicios',
)

// Solo los quizzes con mapa exigen un ancho mínimo. Inicio y gentilicios van siempre.
const canUseApp = computed(() => !isMapQuizRoute.value || isSupportedViewport.value)
</script>

<template>
  <UnsupportedViewportNotice v-if="!canUseApp" />
  <div
    v-else
    class="app-shell"
    :class="{ 'app-shell--gentilicios-mobile': !isSupportedViewport && isGentiliciosRoute }"
  >
    <AppHeader />
    <main
      class="app-main"
      :class="{
        'app-main--home': isHomeRoute,
        'app-main--gentilicios': isGentiliciosRoute,
      }"
    >
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  height: 100svh;
  height: 100dvh;
  max-height: 100dvh;
  display: flex;
  flex-direction: column;
  isolation: isolate;
  overflow: hidden;
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
  overflow-x: clip;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.app-main--home {
  padding: 0.75rem var(--space-page-x);
  overflow: hidden;
}

.app-main--gentilicios {
  padding-top: 1rem;
  padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
}

.app-shell--gentilicios-mobile .app-main--gentilicios {
  padding-top: 0.85rem;
}

@media (min-width: 1024px) {
  .app-main:not(.app-main--home) {
    padding-top: 2rem;
    padding-bottom: 3rem;
  }
}
</style>
