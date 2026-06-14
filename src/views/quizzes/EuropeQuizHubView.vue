<script setup lang="ts">
import { onMounted } from 'vue'
import QuizCategoryCard from '@/components/quiz/QuizCategoryCard.vue'
import { useQuizStore } from '@/stores/quiz'

const quizStore = useQuizStore()

onMounted(() => {
  quizStore.selectRegion('europe')
})
</script>

<template>
  <section>
    <header class="page-header">
      <h1>Quiz de Europa</h1>
      <p>Practica los países europeos y sus capitales.</p>
    </header>

    <div class="category-grid">
      <QuizCategoryCard
        v-for="category in quizStore.europeCategories"
        :key="category.id"
        :category="category"
      />
    </div>
  </section>
</template>
