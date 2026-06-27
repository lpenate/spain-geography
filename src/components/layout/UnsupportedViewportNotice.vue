<script setup lang="ts">
import { MIN_SUPPORTED_WIDTH } from '@/composables/useViewport'
</script>

<template>
  <div class="notice" role="status" aria-live="polite">
    <div class="notice__panel">
      <span class="notice__frame" aria-hidden="true" />
      <h1 class="notice__title">Pantalla demasiado pequeña</h1>
      <p class="notice__text">
        Esta aplicación está pensada para usarse en un ordenador o en una tablet con mayor
        resolución. Amplía la ventana o cambia de dispositivo para continuar.
      </p>
      <p class="notice__hint">Ancho mínimo recomendado: {{ MIN_SUPPORTED_WIDTH }}&nbsp;px</p>
    </div>
  </div>
</template>

<style scoped>
.notice {
  min-height: 100svh;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: max(1.5rem, env(safe-area-inset-top)) var(--space-page-x)
    max(1.5rem, env(safe-area-inset-bottom));
  background: var(--header-bg);
  color: var(--header-text);
}

.notice__panel {
  max-width: 22rem;
  text-align: center;
}

.notice__frame {
  display: block;
  width: 2.5rem;
  height: 0.45rem;
  margin: 0 auto 1.25rem;
  background: var(--accent);
}

.notice__title {
  margin: 0 0 0.85rem;
  font-family: var(--font-display);
  font-size: clamp(1.35rem, 6vw, 1.65rem);
  font-weight: 700;
  line-height: 1.1;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: var(--header-text);
}

.notice__text {
  margin: 0;
  color: var(--header-muted);
  line-height: 1.6;
  font-size: 1rem;
}

.notice__hint {
  margin: 1.25rem 0 0;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
}
</style>
