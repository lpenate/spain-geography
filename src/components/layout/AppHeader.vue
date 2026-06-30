<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useQuizPlayHeader } from '@/composables/useQuizPlayHeader'
import {
  availableQuizCategories,
  pageHeaderContext,
  quizNavLabel,
  quizPlayRoute,
} from '@/utils/quizNav'

const route = useRoute()
const headerOverride = useQuizPlayHeader()

const navCategories = computed(() => availableQuizCategories())

const pageContext = computed(
  () =>
    headerOverride.value ?? pageHeaderContext(route.name, route.params.mode as string | undefined),
)
</script>

<template>
  <header class="header">
    <div class="header__main">
      <RouterLink :to="{ name: 'home' }" class="brand">
        <span class="brand__frame" aria-hidden="true" />
        <span class="brand__text">Geografía Interactiva</span>
      </RouterLink>

      <div v-if="pageContext" class="header__context">
        <p class="header__eyebrow">
          {{ pageContext.eyebrow }}
        </p>
        <p class="header__title">
          {{ pageContext.title }}
        </p>
      </div>
    </div>

    <nav class="nav" aria-label="Quizzes disponibles">
      <RouterLink
        v-for="category in navCategories"
        :key="category.id"
        :to="quizPlayRoute(category.id)"
        class="nav-link"
      >
        {{ quizNavLabel(category) }}
      </RouterLink>
    </nav>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  padding: max(0.85rem, env(safe-area-inset-top)) var(--space-page-x) 0.85rem;
  background: var(--header-bg);
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  flex-shrink: 0;
}

.header__main {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
  flex: 1 1 12rem;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  min-height: var(--touch-target);
  text-decoration: none;
  flex-shrink: 0;
}

.brand__frame {
  width: 0.55rem;
  height: 1.65rem;
  background: var(--accent);
  flex-shrink: 0;
}

.brand__text {
  font-family: var(--font-display);
  font-size: clamp(0.95rem, 3.5vw, 1.05rem);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--header-text);
  transition: color 0.2s ease;
}

.brand:hover .brand__text {
  color: var(--accent);
}

.header__context {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
  padding-left: 0.85rem;
  border-left: 1px solid rgba(255, 255, 255, 0.16);
}

.header__eyebrow {
  margin: 0;
  color: var(--header-muted);
  font-family: var(--font-display);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.header__title {
  margin: 0;
  color: #ffffff;
  font-family: var(--font-display);
  font-size: clamp(0.9rem, 2.8vw, 1.05rem);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  width: auto;
  justify-content: flex-end;
  flex: 0 0 auto;
}

.nav-link {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--touch-target);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  color: var(--header-muted);
  text-decoration: none;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
  white-space: nowrap;
}

.nav-link:hover {
  color: var(--accent);
  background: rgba(255, 204, 0, 0.12);
}

.nav-link.router-link-active {
  color: var(--accent);
  background: rgba(255, 204, 0, 0.12);
}

.nav-link:active {
  background: rgba(255, 255, 255, 0.08);
}
</style>
