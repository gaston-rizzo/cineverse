<script setup lang="ts">

import MovieFilters from "@/components/movies/MovieFilters.vue";
import MovieResults from "@/components/movies/MovieResults.vue";

import { useMoviesFilters } from "@/composables/movies/useMoviesFilters";
import { useMoviesQuery } from "@/composables/movies/useMoviesQuery";

import { useI18n } from "vue-i18n";

const filters = useMoviesFilters();

const { locale } = useI18n();
const apiLanguage = locale;

const { data, isLoading, error } = useMoviesQuery(filters, apiLanguage);
</script>

<template>
  
  <div class="page-wrapper">
    <div class="movies-layout">
      <aside class="filters-panel">
        <MovieFilters :movieFilters="filters" />
      </aside>

      <main class="movies-content">
        <MovieResults :data="data" :isLoading="isLoading" :error="error" />
      </main>
    </div>
  </div>
</template>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  position: relative;  
  overflow: visible;
  color: #e5e7eb;
  padding-top: 40px;
  padding-bottom: 60px;
  background: #0b0f19;
  isolation: isolate;
}

.page-wrapper::before {
  content: "";
  position: absolute;
  inset: -300px;
  z-index: 0;

  background:
    radial-gradient(circle at 20% 20%, rgba(229, 9, 20, 0.15), transparent 40%),
    radial-gradient(
      circle at 80% 30%,
      rgba(124, 58, 237, 0.18),
      transparent 45%
    ),
    radial-gradient(
      circle at 50% 80%,
      rgba(30, 64, 175, 0.18),
      transparent 50%
    ),
    linear-gradient(180deg, #0b0f19 0%, #0f172a 40%, #0b0f19 100%);

  filter: blur(90px);

  animation: backgroundDrift 45s ease-in-out infinite alternate;
}

.page-wrapper::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("@/assets/noise.svg");
  opacity: 0.06;
  mix-blend-mode: overlay;
  pointer-events: none;
}

@keyframes backgroundDrift {
  0% {
    transform: translate3d(-4%, -2%, 0) scale(1);
  }

  50% {
    transform: translate3d(3%, 2%, 0) scale(1.1);
  }

  100% {
    transform: translate3d(-2%, 4%, 0) scale(1.05);
  }
}

.movies-layout {
  display: grid;
  /* La primera columna (280px) es el sidebar con filtros. */
  /* La segunda columna (1fr) es el contenido principal donde aparecen las películas. */
  grid-template-columns: 280px 1fr;
  gap: 32px;
  /* Como .movies-layout tiene margin: auto y max-width: 1400px, toda la grilla está centrada en la página. */
  /* ancho máximo de la grilla */
  max-width: 1400px;  
  /* centra la grilla horizontalmente */
  margin: auto;
  padding: 30px;
  position: relative;
  z-index: 1;
}

/* PANEL LATERAL */

.filters-panel {
  position: sticky;
  top: 110px;
  height: fit-content;
  align-self: start;
}

/* GRID PELÍCULAS */

.movies-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  isolation: isolate;
}
</style>