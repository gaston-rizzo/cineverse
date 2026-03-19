<script setup lang="ts">

/* ============================================================================
 *  MoviesView.vue
 * ============================================================================
 *
 * Este componente representa la página principal de filtros y la grilla
 * de películas 
 *
 * Funciones principales:
 * 
 * 1. Renderiza el panel lateral de filtros (MovieFilters) y la grilla de
 *    resultados (MovieResults).
 * 2. Gestiona los filtros mediante el composable useMoviesFilters.
 * 3. Ejecuta consultas paginadas a la API de películas mediante
 *    useMoviesQuery, incluyendo soporte para scroll infinito.
 * 4. Sincroniza el idioma de la API con el idioma actual de la app (useI18n).
 * 5. Expone un resetSignal que permite a MovieResults reiniciar la grilla
 *    completamente cuando los filtros cambian.
 * 6. Controla el comportamiento de UX al cambiar filtros (blur de inputs
 *    activos para evitar glitches con scroll o dropdowns abiertos).
 *
 * En resumen, MoviesView.vue es la página contenedora que combina la lógica
 * de filtros, consultas y visualización de películas, asegurando que la
 * grilla de películas se actualice correctamente ante cualquier interacción
 * del usuario.
 */

  import MovieFilters from "../components/MovieFilters.vue";
  import MovieResults from "../components/MovieResults.vue";

  import { useMoviesFilters } from "@/features/movies/composables/useMoviesFilters";
  import { useMoviesQuery } from "@/features/movies/composables/useMoviesQuery";

  import { useI18n } from "vue-i18n";
  import { ref, watch } from "vue";

// ============================================================================
// FILTROS DE PELÍCULAS
// ============================================================================
//
// useMoviesFilters es un composable que gestiona el estado de los filtros
// (género, año, calificación, búsqueda por texto, etc.).
// Devuelve valores reactivos y un queryKey para saber cuándo cambian los filtros.
const filters = useMoviesFilters();

// ============================================================================
// CONFIGURACIÓN DE IDIOMA PARA LA API
// ============================================================================
//
// useI18n nos da la información de idioma actual.
// apiLanguage se usa para pasar el idioma correcto a la API de películas.
const { locale } = useI18n();
const apiLanguage = locale;

// ============================================================================
// QUERY INFINITA DE PELÍCULAS
// ============================================================================
//
// useMoviesQuery recibe los filtros y el idioma, y devuelve un conjunto
// de propiedades y métodos para manejar la lista paginada de películas:
//
// - data: resultados paginados (pages de películas)
// - isLoading: si la query está cargando por primera vez
// - isFetching: si la query se está actualizando (refetch)
// - error: cualquier error ocurrido
// - fetchNextPage: función para traer la siguiente página
// - hasNextPage: indica si hay más páginas
// - isFetchingNextPage: indica si se está cargando la siguiente página
const {
  data,
  isLoading,
  isFetching,
  error,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
} = useMoviesQuery(filters, apiLanguage);

// ============================================================================
// RESET SIGNAL (REACTIVO)
// ============================================================================
//
// resetSignal se utiliza para notificar a MovieResults que debe reiniciar
// completamente la grilla de películas.
//
// Se usa un número en lugar de booleano para asegurar que cada cambio
// dispare el watcher, incluso si los resets ocurren consecutivamente.
//
// El watcher en MovieResults escucha este valor y realiza:
// - limpiar la lista de películas visibles
// - reiniciar flags de carga
// - scroll al top de la página
const resetSignal = ref(0);

// ============================================================================
// WATCHER: DETECTA CAMBIOS EN LOS FILTROS
// ============================================================================
//
// Cada vez que filters.queryKey.value cambia (indicando que algún filtro se modificó):
// 1) Se hace blur al elemento activo para cerrar inputs/combos abiertos.
// 2) Se incrementa resetSignal para que MovieResults reinicie su estado.
//
// Esto garantiza que la grilla se reinicie correctamente ante cualquier cambio
// de filtros, evitando conflictos con el infinite scroll o datos antiguos.
watch(
  () => filters.queryKey.value,
  () => {
    // Sin el blur(), a veces el input queda activo y el scroll infinito puede comportarse raro 
    (document.activeElement as HTMLElement)?.blur();
    resetSignal.value++;
  }
);

</script>

<template>
  
  <div class="page-wrapper">
    <div class="movies-layout">
      <aside class="filters-panel">
        <MovieFilters :movieFilters="filters" />
      </aside>

      <main class="movies-content">

        <MovieResults
          :data="data"
          :isLoading="isLoading"
          :isFetching="isFetching"
          :error="error"
          :hasNextPage="hasNextPage"
          :isFetchingNextPage="isFetchingNextPage"
          :resetSignal="resetSignal"
          @load-more="fetchNextPage"
        />

      </main>
    </div>
  </div>
</template>

<style scoped>
.page-wrapper {
  /*min-height: 100vh;*/
  /*position: relative; */
  /* lala hidden funciona footer pero se suena filtro de busqueda */
  overflow: visible;
  color: #e5e7eb;
  padding-top: 20px;
  padding-bottom: 40px;
  background: #0b0f19;
  isolation: isolate;
}

.page-wrapper::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;

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
  padding-bottom: 20px;
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