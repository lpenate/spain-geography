<script setup lang="ts">
import { computed } from 'vue'
import QuizCategoryCard from '@/components/quiz/QuizCategoryCard.vue'
import { quizCategoriesByRegion } from '@/utils/quizNav'

const categoriesByRegion = computed(() => quizCategoriesByRegion())

const sections = computed(() =>
  [
    {
      id: 'spain',
      title: 'España',
      categories: categoriesByRegion.value.spain,
    },
    {
      id: 'europe',
      title: 'Europa',
      categories: categoriesByRegion.value.europe,
    },
  ].filter((section) => section.categories.length > 0),
)
</script>

<template>
  <div class="home-page">
    <header class="home-intro">
      <p class="eyebrow">Índice de ejercicios</p>
      <h1 class="home-intro__title">Elige un mapa para practicar</h1>
    </header>

    <div class="home-board">
      <section v-for="section in sections" :key="section.id" class="home-band">
        <h2 class="home-band__title">{{ section.title }}</h2>

        <div class="home-band__cards">
          <QuizCategoryCard
            v-for="category in section.categories"
            :key="category.id"
            :category="category"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  flex: 1;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
  gap: 1rem;
}

.home-intro {
  padding-bottom: 0.75rem;
  border-bottom: 3px solid var(--accent);
}

.home-intro .eyebrow {
  margin-bottom: 0.3rem;
}

.home-intro__title {
  margin: 0;
  font-size: 1.75rem;
  line-height: 1.05;
}

.home-board {
  display: grid;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
  min-height: 0;
}

.home-band {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 0.45rem;
  min-height: 0;
}

.home-band__title {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.home-band__cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
  min-height: 0;
}
</style>
