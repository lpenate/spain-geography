<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="hero">
    <p class="eyebrow">Aprende geografía con mapas interactivos</p>
    <h1>Quiz de España y Europa</h1>
    <p class="lead">
      Practica las comunidades autónomas, capitales de provincia, países europeos y sus capitales
      mediante ejercicios con mapas interactivos.
    </p>
    <div class="actions">
      <RouterLink class="button button-primary" to="/espana"> Explorar España </RouterLink>
      <RouterLink class="button button-secondary" to="/europa"> Explorar Europa </RouterLink>
    </div>
  </section>

  <section class="cards">
    <article class="card">
      <h2>España</h2>
      <p>Comunidades autónomas y capitales de provincia.</p>
      <ul>
        <li>Comunidades autónomas</li>
        <li>Capitales de provincia</li>
      </ul>
    </article>
    <article class="card">
      <h2>Europa</h2>
      <p>Países y capitales del continente europeo.</p>
      <ul>
        <li>Países de Europa</li>
        <li>Capitales europeas</li>
      </ul>
    </article>
  </section>
</template>

<style scoped>
.hero {
  text-align: center;
  margin-bottom: 2rem;
}

@media (min-width: 640px) {
  .hero {
    margin-bottom: 3rem;
  }
}

.eyebrow {
  color: var(--accent);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.8rem;
}

.lead {
  max-width: 42rem;
  margin: 0 auto 1.5rem;
  color: var(--text-muted);
  line-height: 1.6;
  font-size: clamp(0.95rem, 2.5vw, 1.05rem);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

@media (min-width: 480px) {
  .actions {
    flex-direction: row;
    justify-content: center;
    flex-wrap: wrap;
    width: auto;
    gap: 1rem;
  }

  .actions .button {
    flex: 0 1 auto;
  }
}

@media (max-width: 479px) {
  .actions .button {
    width: 100%;
  }
}

.cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .cards {
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1.5rem;
  }
}

.card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.25rem;
  background: var(--surface);
}

@media (min-width: 640px) {
  .card {
    padding: 1.5rem;
  }
}

.card h2 {
  margin: 0 0 0.5rem;
}

.card p {
  color: var(--text-muted);
  margin-bottom: 1rem;
}

.card ul {
  margin: 0;
  padding-left: 1.2rem;
  color: var(--text-strong);
}
</style>
