<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <header class="header">
    <RouterLink to="/" class="brand"> Geografía Interactiva </RouterLink>
    <nav class="nav" aria-label="Secciones principales">
      <RouterLink to="/espana" class="nav-link"> España </RouterLink>
      <RouterLink to="/europa" class="nav-link"> Europa </RouterLink>
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
  padding: max(0.75rem, env(safe-area-inset-top)) var(--space-page-x) 0.75rem;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  flex-shrink: 0;
}

.brand {
  font-size: clamp(1rem, 3.5vw, 1.1rem);
  font-weight: 600;
  color: var(--text-strong);
  text-decoration: none;
  min-height: var(--touch-target);
  display: inline-flex;
  align-items: center;
}

.nav {
  display: flex;
  gap: 0.5rem;
  width: 100%;
}

@media (min-width: 480px) {
  .nav {
    width: auto;
    gap: 0.75rem;
  }
}

.nav-link {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--touch-target);
  padding: 0.5rem 1rem;
  border-radius: 10px;
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 500;
  touch-action: manipulation;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

@media (min-width: 480px) {
  .nav-link {
    flex: 0 0 auto;
  }
}

.nav-link.router-link-active {
  color: var(--accent);
  background: var(--accent-soft);
}

.nav-link:active {
  background: var(--surface-muted);
}
</style>
