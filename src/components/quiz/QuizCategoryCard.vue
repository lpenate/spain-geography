<script setup lang="ts">
import type { QuizCategory } from '@/types/quiz'
import { RouterLink } from 'vue-router'

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
      :to="`/quiz/${category.id}`"
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
  border-radius: 12px;
  padding: 1rem;
  background: var(--surface);
}

@media (min-width: 640px) {
  .category-card {
    padding: 1.25rem;
  }
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
  font-size: clamp(1rem, 3vw, 1.15rem);
}

.category-card p {
  margin: 0 0 1rem;
  color: var(--text-muted);
  line-height: 1.5;
  font-size: 0.95rem;
}

.badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
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
  border-radius: 8px;
  color: var(--text-muted);
  background: var(--surface-muted);
  font-size: 0.9rem;
}
</style>
