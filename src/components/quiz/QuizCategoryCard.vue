<script setup lang="ts">
import type { QuizCategory } from '@/types/quiz'
import { RouterLink } from 'vue-router'
import { quizPlayRoute } from '@/utils/quizNav'

defineProps<{
  category: QuizCategory
}>()
</script>

<template>
  <article class="category-card">
    <div class="category-card__header">
      <h2>{{ category.title }}</h2>
      <span class="badge">{{ category.available ? 'Disponible' : 'Próximamente' }}</span>
    </div>
    <p>{{ category.description }}</p>

    <RouterLink
      v-if="category.available"
      class="button button-primary category-card__action"
      :to="quizPlayRoute(category.id)"
    >
      Empezar quiz
    </RouterLink>

    <div v-else class="map-placeholder" aria-hidden="true">
      <span>Próximamente</span>
    </div>
  </article>
</template>

<style scoped>
.category-card {
  border: 1px solid var(--border);
  border-left: 4px solid var(--accent);
  border-radius: var(--radius-md);
  padding: 1.35rem;
  background: var(--surface);
}

.category-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.category-card h2 {
  margin: 0;
  font-size: clamp(1rem, 3vw, 1.2rem);
}

.category-card p {
  margin: 0 0 1.15rem;
  color: var(--text-muted);
  line-height: 1.55;
  font-size: 0.98rem;
}

.badge {
  font-family: var(--font-display);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.35rem 0.55rem;
  border-radius: var(--radius-sm);
  background: var(--accent-soft);
  color: var(--accent-strong);
  white-space: nowrap;
  flex-shrink: 0;
}

.category-card__action {
  width: 100%;
}

.map-placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  min-height: 3.5rem;
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  background: var(--surface-muted);
  font-family: var(--font-display);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>
