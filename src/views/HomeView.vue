<script setup lang="ts">
import { computed } from 'vue'
import QuizCategoryCard from '@/components/quiz/QuizCategoryCard.vue'
import { useViewport } from '@/composables/useViewport'
import { quizCategoriesByRegion } from '@/utils/quizNav'

const { isSupportedViewport } = useViewport()
const categoriesByRegion = computed(() => quizCategoriesByRegion())

const sections = computed(() => {
  const grouped = categoriesByRegion.value

  if (!isSupportedViewport.value) {
    return [
      {
        id: 'phone',
        title: 'Disponible en este dispositivo',
        categories: grouped.spain.filter((category) => category.id === 'gentilicios'),
      },
    ].filter((section) => section.categories.length > 0)
  }

  return [
    {
      id: 'spain',
      title: 'España',
      categories: grouped.spain,
    },
    {
      id: 'europe',
      title: 'Europa',
      categories: grouped.europe,
    },
  ].filter((section) => section.categories.length > 0)
})
</script>

<template>
  <div class="home-page" :class="{ 'home-page--compact': !isSupportedViewport }">
    <header class="home-intro">
      <p class="eyebrow">Índice de ejercicios</p>
      <h1 class="home-intro__title">
        {{ isSupportedViewport ? 'Elige un mapa para practicar' : 'Practica gentilicios' }}
      </h1>
      <p v-if="!isSupportedViewport" class="home-intro__note">
        En pantallas estrechas puedes estudiar y hacer el test de gentilicios. Los mapas requieren
        más ancho.
      </p>
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

.home-page--compact {
  grid-template-rows: auto auto;
  gap: 1.1rem;
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
  font-size: clamp(1.45rem, 7vw, 1.75rem);
  line-height: 1.05;
}

.home-intro__note {
  margin: 0.65rem 0 0;
  max-width: 28rem;
  color: var(--text-muted);
  line-height: 1.5;
  font-size: 0.95rem;
}

.home-board {
  display: grid;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
  min-height: 0;
}

.home-page--compact .home-board {
  grid-template-rows: auto;
}

.home-band {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 0.45rem;
  min-height: 0;
}

.home-page--compact .home-band {
  grid-template-rows: auto auto;
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
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: 0.85rem;
  min-height: 0;
}

.home-page--compact .home-band__cards {
  grid-template-columns: 1fr;
}
</style>
