<script setup lang="ts">
import QuizCategoryCard from '@/components/quiz/QuizCategoryCard.vue'
import { availableQuizCategories } from '@/utils/quizNav'
</script>

<template>
  <section class="intro">
    <p class="intro__lead">
      Practica comunidades autónomas y provincias mediante ejercicios con mapas interactivos. Elige
      un modo en la cabecera o aquí abajo.
    </p>
  </section>

  <section>
    <div class="category-grid">
      <QuizCategoryCard
        v-for="category in availableQuizCategories()"
        :key="category.id"
        :category="category"
      />
    </div>
  </section>
</template>

<style scoped>
.intro {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
}

@media (min-width: 640px) {
  .intro {
    margin-bottom: 2.5rem;
    padding-bottom: 2rem;
  }
}

.intro__lead {
  max-width: 38rem;
  margin: 0;
  color: var(--text-muted);
  line-height: 1.65;
  font-size: clamp(1rem, 2.5vw, 1.15rem);
}
</style>
