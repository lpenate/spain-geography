<script setup lang="ts">
import { onMounted } from 'vue'
import QuizCategoryCard from '@/components/quiz/QuizCategoryCard.vue'
import { useQuizStore } from '@/stores/quiz'

const quizStore = useQuizStore()

onMounted(() => {
  quizStore.selectRegion('spain')
})
</script>

<template>
  <section>
    <header class="page-header">
      <h1>Quiz de España</h1>
      <p>Aprende las comunidades autónomas y las capitales de provincia.</p>
    </header>

    <div class="category-grid">
      <QuizCategoryCard
        v-for="category in quizStore.spainCategories"
        :key="category.id"
        :category="category"
      />
    </div>
  </section>
</template>
