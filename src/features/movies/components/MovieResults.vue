<script setup lang="ts">

/* ============================================================================
 *  MovieResults.vue
 * ============================================================================
 *
 * Este componente representa la grilla de resultados de películas
 * dentro de la página MoviesView.vue.
 *
 * Funciones principales:
 * 
 * 1. Recibe datos paginados de películas desde un composable (useMoviesQuery)
 *    a través de props.
 * 2. Filtra películas inválidas (sin poster) y mantiene una lista "validMovies"
 *    que se renderiza en la grilla.
 * 3. Implementa infinite scroll mediante un IntersectionObserver y un
 *    sentinel al final de la lista.
 * 4. Permite reiniciar la grilla completamente cuando cambia resetSignal.
 * 5. Emite eventos "load-more" al padre para cargar la siguiente página.
 * 6. Gestiona estados de carga y prefetch para evitar huecos en la UI.
 * 7. Muestra estados de carga, vacío y error con animaciones cinematográficas.
 * 8. Aplica animaciones, partículas y efectos visuales para una experiencia
 *    de grilla de películas más atractiva.
 *
 * En resumen, MovieResults.vue es el componente encargado de visualizar
 * los resultados de películas y manejar el scroll infinito de manera eficiente
 * y visualmente atractiva.
 */

import { ref, watch } from "vue";
import type { PaginatedResponse } from "@/shared/types/paginated-response";
import type { Movie } from "@/features/movies/types/movie";

import MovieCard from "./MovieCard.vue";

import { useI18n } from "vue-i18n";

// ============================================================================
// INTERNACIONALIZACIÓN
// ============================================================================
//
// useI18n permite traducir textos según el idioma activo.
const { t } = useI18n();

// ============================================================================
// PROPS DEL COMPONENTE
// ============================================================================
//
// Recibimos datos y estado desde el componente padre.
//
// - data: resultado de useInfiniteQuery, paginado
// - isLoading: indica si la query inicial aún está cargando
// - isFetching: indica si se está refetchando la query
// - error: error de la query (si existe)
// - isFetchingNextPage: si se está cargando la siguiente página
// - resetSignal: número que cambia cuando se necesita reiniciar la grilla
//    El watcher detecta cualquier cambio de valor (0 → 1 → 2 → 3) y se dispara cada vez.
//    Es mucho más confiable para "señales de reinicio" que un booleano,
//    porque si es el usuario cambia filtros rápido o varias veces puede haber reseteos que no se ejecuten
// - hasNextPage: si hay más páginas disponibles para cargar
const props = defineProps<{  
  data: { pages: PaginatedResponse<Movie>[] } | undefined;
  isLoading: boolean;
  isFetching: boolean;   
  error: unknown;
  isFetchingNextPage: boolean | undefined;
  resetSignal: number;
  hasNextPage: boolean | undefined;
}>();

// ============================================================================
// LISTA DE PELÍCULAS VÁLIDAS
// ============================================================================
//
// Se llena a partir de todas las páginas de la query infinita
// filtrando películas sin poster o con datos inválidos.
// Esta es la lista que se renderiza en el template.
const validMovies = ref<Movie[]>([]);

// ============================================================================
// SENTINEL DEL INFINITE SCROLL
// ============================================================================
//
// Elemento al final de la grilla que usa el IntersectionObserver
// para detectar cuándo cargar más películas automáticamente.
const loadMoreTrigger = ref<HTMLElement | null>(null);

// ============================================================================
// FLAG DE CARGA DE NUEVAS PÁGINAS
// ============================================================================
//
// Evita que el observer dispare múltiples requests simultáneas
// mientras se está cargando la siguiente página.
const loadingMore = ref(false);

// ============================================================================
// FLAG DE DATOS YA PROCESADOS
// ============================================================================

// Flag que indica que los datos ya fueron procesados
// Se usa para evitar mostrar el estado vacío antes de que termine
// la primera carga de datos.
const hasProcessedData = ref(false);

// ============================================================================
// EMITS DEL COMPONENTE
// ============================================================================
//
// Este componente emite el evento "load-more" cuando necesita que el
// componente padre cargue la siguiente página de resultados.
//
// El padre normalmente manejará este evento llamando a "fetchNextPage"
// (por ejemplo con TanStack Query).

const emit = defineEmits(["load-more"])

// Bandera para ignorar cargas automáticas de películas temporalmente.
// Se utiliza principalmente cuando se resetea la lista (resetSignal) 
// para evitar que el IntersectionObserver dispare nuevas requests mientras
// se limpia y renderiza la grilla.
let ignoreLoads = false;

// =========================================================================
// WATCHER: RESET DE ESTADO CUANDO CAMBIA "resetSignal"
// =========================================================================

// Este watcher se dispara cada vez que "props.resetSignal" cambia.
// Se usa para reiniciar completamente la grilla y el estado del scroll
// (por ejemplo, al cambiar filtros o iniciar una nueva búsqueda).

watch(() => props.resetSignal, async () => {

  // BLOQUEO TEMPORAL DE CARGAS AUTOMÁTICAS
  // Evita que el observer de infinite scroll o cualquier
  // auto-load interfiera mientras reseteamos todo.
  ignoreLoads = true;

  // RESET TOTAL DE ESTADO
  // Desactivamos el auto-scroll (usuario debe reactivar manualmente)
  autoScrollEnabled.value = false;

  // Reiniciamos el flag de carga de más páginas
  loadingMore.value = false;

  // Limpiamos la lista de películas visibles
  validMovies.value = [];

  // SCROLL AL TOP DE LA PÁGINA
  // Asegura que el usuario vea la grilla desde el inicio
  window.scrollTo({
    top: 0,
    behavior: "auto" // sin animación
  });

  // Esperamos que Vue actualice el DOM después de limpiar "validMovies"
  // Esto garantiza que el observer del sentinel (si existe) no se rompa
  await nextTick();

  // LIBERAMOS EL BLOQUEO DE CARGAS AUTOMÁTICAS
  // Ahora el observer o cualquier watcher puede disparar nuevas cargas
  ignoreLoads = false;
});

// Cantidad mínima de películas que intentamos mostrar en pantalla. 
// Si la cantidad de películas visibles es menor a este valor,
// se intentan cargar más páginas automáticamente.
// aunque no garantiza llenar completamente la grilla
// Puede seguir habiendo huecos si:
//  muchas películas son filtradas
//  no hay suficientes resultados en páginas siguientes
//  se llega al final de la paginación (hasNextPage = false)
// También es posible que al final haya más películas visibles que este mínimo
// (ej: 27, 30) si la página trae más resultados de los necesarios.
const MIN_MOVIES = 20;

/**
 * ============================================================================
 * WATCHER: REACCIONA A CAMBIOS EN LOS DATOS DE LA QUERY INFINITA
 * ============================================================================
 *
 * Este watcher se ejecuta cada vez que cambia props.data,
 * que es el resultado de "useInfiniteQuery".
 *
 * En TanStack Query, los resultados vienen paginados así:
 *
 * pages = [
 *   { results: [...] }, // page 1
 *   { results: [...] }, // page 2
 *   { results: [...] }  // page 3
 * ]
 *
 * ---------------------------------------------------------------------------
 * RESPONSABILIDADES DE ESTE WATCHER
 * ---------------------------------------------------------------------------
 *
 * 1) Unificar todas las páginas en una sola lista
 * ---------------------------------------------------------------------------
 * Cada página tiene su propio array "results".
 * Acá los combinamos en una sola lista continua (allMovies)
 * para poder renderizar correctamente la grilla.
 *
 * IMPORTANTE:
 * Esto NO es opcional en infinite query.
 *
 *
 * 2) Filtrar películas inválidas
 * ---------------------------------------------------------------------------
 * Eliminamos películas que:
 * - No tienen poster_path
 * - Tienen valores inválidos como "null"
 *
 * Esto evita:
 * - Imágenes rotas
 * - Huecos visuales en la grilla
 *
 * 3) Actualizar validMovies
 * ---------------------------------------------------------------------------
 * Es la lista final que usa el template para renderizar. 
 *
 * 4) AUTO-CARGA DE PÁGINAS (clave para tu caso)
 * ---------------------------------------------------------------------------
 * Si después de filtrar hay pocas películas visibles,
 * seguimos cargando más páginas automáticamente.
 *
 * ¿Por qué?
 *
 * Porque TMDB pagina ANTES de aplicar los filtros.
 * Entonces:
 *
 *   API trae 20 resultados →
 *   filtramos →
 *   quedan 5 → (huecos)
 *
 * Solución:
 * seguir trayendo páginas hasta alcanzar un mínimo.
 *
 * 5) Esperar render del DOM (nextTick)
 * ---------------------------------------------------------------------------
 * Necesario porque al agregar nuevas películas:
 * - cambia el layout
 * - se mueve el sentinel del infinite scroll
 *
 * 6) Re-registrar el IntersectionObserver
 * ---------------------------------------------------------------------------
 * Al cambiar el DOM, el observer puede quedar desincronizado.
 * Por eso:
 * - lo desobservamos
 * - lo volvemos a observar
 *
 * ---------------------------------------------------------------------------
 * immediate: true
 * ---------------------------------------------------------------------------
 * Hace que el watcher se ejecute también al montar el componente
 * si ya hay datos disponibles.
 */

watch(
  () => props.data,
  async (data) => {

    // Marcamos que vamos a reprocesar los datos.
    // Esto evita que el empty state se muestre mientras se recalcula la lista.
    hasProcessedData.value = false;

    // Obtenemos las páginas de la query infinita.
    // Cada página contiene su propio array de resultados.
    const pages = data?.pages;

    // Si no hay páginas todavía, no hacemos nada
    if (!pages || pages.length === 0) return;

    // Unificamos todos los resultados de todas las páginas
    const allMovies = pages.flatMap(p => p.results);

    // Filtramos películas inválidas
    validMovies.value = allMovies.filter(
      movie => movie.poster_path && !movie.poster_path.includes("null")
    );

    // Marcamos que el procesamiento de datos finalizó.
    // A partir de este punto ya es seguro renderizar la grilla
    // o mostrar el empty state sin riesgo de falsos vacíos.
    hasProcessedData.value = true;

    // si hay pocos resultados seguimos cargando y pedimos otra página
    // IMPORTANTE:
    // - hasNextPage → evita pedir páginas inexistentes
    // - isFetchingNextPage → evita múltiples requests simultáneos
    if (
      validMovies.value.length < MIN_MOVIES &&
      props.hasNextPage &&
      !props.isFetchingNextPage
    ) {
      emit("load-more");
    }

    // Esperamos a que Vue renderice el DOM actualizado
    await nextTick();

    // Re-sincronizamos el observer del infinite scroll
    if (autoScrollEnabled.value && loadMoreTrigger.value) {
      observer.unobserve(loadMoreTrigger.value);
      observer.observe(loadMoreTrigger.value);
    }
  }
  // { immediate: true }
);

// ============================================================================
// WATCH: CONTROL DEL ESTADO DE CARGA DE PAGINAS
// ============================================================================
//
// Este watcher observa "isFetchingNextPage", que indica si
// TanStack Query está trayendo la siguiente página.
//
// Cuando la carga termina "(false)"", se resetea "loadingMore".
//
// Esto permite que el IntersectionObserver pueda volver a
// disparar una nueva carga cuando el usuario siga scrolleando.

watch(() => props.isFetchingNextPage, (v) => {
  // Cuando la carga termina, liberamos el bloqueo.
  if (!v) loadingMore.value = false
})

import { onMounted, onUnmounted, nextTick } from "vue"

// ============================================================================
// INTERSECTION OBSERVER
// ============================================================================
//
// Se utiliza un IntersectionObserver para implementar el infinite scroll.
//
// Este observer monitorea un elemento "sentinel" colocado al final de la grilla.
// Cuando el sentinel entra en el área visible (o dentro del rootMargin),
// se dispara la carga de más resultados.

// El sentinel es simplemente un elemento vacío al final de la lista que se usa
//  como detector de scroll. Sirve para detectar cuándo el usuario llegó al final
// de la lista.

// El observer mira el sentinel:
//  observer.observe(loadMoreTrigger.value)
//  Cuando el sentinel entra en el área observada:
//  entry.isIntersecting
//  Se dispara la carga:
//  emit("load-more")

let observer: IntersectionObserver

// ============================================================================
// CONTROL DEL AUTO-SCROLL
// ============================================================================
//
// El infinite scroll no está activo inmediatamente.
// Primero el usuario debe presionar el botón "Mostrar más".
//
// Esto evita que el componente cargue muchas páginas automáticamente
// sin interacción del usuario.

const autoScrollEnabled = ref(false)

onMounted(async () => {

  // nextTick en Vue.js sirve para esperar a que Vue termine de actualizar el DOM después de un cambio reactivo.
  // Esperamos a que Vue termine de renderizar el DOM.
  // Esto asegura que el sentinel ya exista antes de observarlo.
  await nextTick()

  observer = new IntersectionObserver(entries => {

    const entry = entries[0]

    // BLOQUEO TEMPORAL
    // Si estamos reseteando la grilla, ignoramos cualquier trigger
    if (ignoreLoads) return;

    // BLOQUEO EXTRA CLAVE
    // Solo activamos el observer si el usuario habilitó el auto-scroll
    if (!autoScrollEnabled.value) return;

    // Seguridad: si por alguna razón la entrada no existe, no hacemos nada
    if (!entry) return

    // ========================================================================
    // CONDICIONES PARA CARGAR MÁS RESULTADOS
    // ========================================================================
    //
    // entry.isIntersecting
    //   → el sentinel entró en el área observada.
    //
    // autoScrollEnabled
    //   → el usuario activó el infinite scroll manualmente.
    //
    // !props.isFetchingNextPage
    //   → evita disparar nuevas cargas mientras la API aún responde.
    //
    // !loadingMore
    //   → evita múltiples triggers seguidos del observer.
    //
    // props.hasNextPage
    //   → evita llamadas cuando ya no hay más páginas disponibles.
    //
    if (
      entry.isIntersecting &&
      autoScrollEnabled.value &&
      !props.isFetchingNextPage &&
      !loadingMore.value &&
      props.hasNextPage
    ) {

      loadingMore.value = true

      // Dispara la carga de la siguiente página.
      emit("load-more")

      // ======================================================================
      // PREFETCH DE UNA PÁGINA EXTRA
      // ======================================================================
      //
      // Si el usuario scrollea muy rápido, puede llegar al final antes de que
      // la siguiente página termine de cargarse.
      //
      // Para evitar huecos visuales, se dispara un segundo load-more
      // unos milisegundos después, adelantando la carga de la página siguiente.
      //
      // Flujo esperado:
      //
      // scroll rápido
      // ↓
      // carga página N
      // ↓
      // prefetch página N+1
      //
      setTimeout(() => {
        if (props.hasNextPage) {
          emit("load-more")
        }
      }, 200)

    }

  },{

    // ========================================================================
    // CONFIGURACIÓN DEL OBSERVER
    // ========================================================================

    // rootMargin extiende el área de detección fuera del viewport.
    // Esto permite empezar a cargar la siguiente página antes de que
    // el usuario llegue realmente al final del contenido.
    //
    // En este caso, la carga comienza aproximadamente 2500px antes
    // de que el sentinel sea visible en pantalla.
    //

    // Con "2500px", el observer considera el sentinel "visible" 2500px
    // antes de que realmente aparezca en pantalla, disparando el callback
    // con antelación. Esto permite pre-cargar la siguiente página
    // y evita huecos mientras el usuario scrollea.
    //
    // Nota: aunque la carga ocurre antes de ver el sentinel, el
    // sentinel sigue siendo necesario como referencia para el observer.

    rootMargin: "2500px",

    // threshold define qué porcentaje del elemento observado debe
    // ser visible para disparar el callback.
    //
    // 0 significa que basta con que el sentinel toque el área
    // observada para activar el observer.
    //
    threshold: 0
  })

  // Registramos el sentinel en el observer.
  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }

})

// ============================================================================
// LIMPIEZA AL DESTRUIR EL COMPONENTE
// ============================================================================
//
// Cuando el componente se desmonta, desconectamos el observer para evitar
// fugas de memoria y callbacks innecesarios.
//
onUnmounted(() => {
  observer?.disconnect()
})

// ============================================================================
// ACTIVACIÓN MANUAL DEL INFINITE SCROLL
// ============================================================================
//
// Este método se ejecuta cuando el usuario presiona el botón
// "Mostrar más".
//
// 1) Activa el auto scroll.
// 2) Dispara la primera carga de la siguiente página.
//
function enableScroll(){
  autoScrollEnabled.value = true 
  emit("load-more")
}

// Guarda el id del frame actual para evitar ejecutar múltiples veces por frame
let frame: number | null = null

// Guarda la última card que tuvo el efecto aplicado.
// Sirve para resetearla cuando el cursor pasa a otra.
let lastTilted: HTMLElement | null = null

// ============================================================================
// HOVER MAGNÉTICO / TILT 3D DE LA TARJETA (INCLINACIÓN)
// ============================================================================

// Maneja el movimiento del mouse sobre la grilla.
// Aplica un efecto 3D (tilt + glare) solo a la card debajo del cursor.
// Solo una card puede estar activa a la vez.
// Este efecto crea una sensación de profundidad cuando el usuario mueve
// el cursor sobre la tarjeta. La card rota levemente en 3D dependiendo de
// la posición del cursor dentro del elemento.

// La idea es simular que la tarjeta "sigue" al cursor como si estuviera
// suspendida en el espacio.

// La card rota levemente dependiendo de la posición del cursor dentro del elemento.

// Usa requestAnimationFrame para limitar ejecuciones y mantener fluidez.

function handleGridMouseMove(e: MouseEvent) {
  // Si ya hay un frame pendiente, no programamos otro
  if (frame !== null) return

  // Programamos la lógica para ejecutarse en el próximo frame de renderizado.
  // requestAnimationFrame sincroniza el cálculo con el repintado del navegador,
  // evitando ejecuciones excesivas y mejorando la fluidez del efecto.

  // Throttle: limita cuántas veces se ejecuta esta función,
  // Throttle con requestAnimationFrame:  
  // asegura que la lógica se ejecute como máximo una vez por frame (~60fps),
  // aunque el evento (mousemove) se dispare muchas veces.

  frame = requestAnimationFrame(() => {
    // Liberamos el frame para el siguiente ciclo
    frame = null

    // Buscamos la card bajo el cursor
    const target = (e.target as HTMLElement).closest(".movie-card")
    if (!target) return

    // Obtenemos la capa que se transforma
    const tiltLayer = target.querySelector(".tilt-layer") as HTMLElement

    if (!tiltLayer) return

    // Si cambiamos de card, reseteamos la anterior
    if (lastTilted && lastTilted !== tiltLayer) {
      lastTilted.style.transform = `
        perspective(900px)
        rotateX(0deg)
        rotateY(0deg)
        scale(1)
      `
      lastTilted.style.setProperty("--glare-x", "50%")
      lastTilted.style.setProperty("--glare-y", "50%")
    }

    // Guardamos la card actual como activa
    lastTilted = tiltLayer

    // Medidas de la card
    const rect = tiltLayer.getBoundingClientRect()

    // Posición del mouse dentro de la card
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Centro de la card
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Cálculo de inclinación en base a distancia al centro
    const rotateX = ((y - centerY) / centerY) * -9
    const rotateY = ((x - centerX) / centerX) * 9

    // Aplicamos transformación 3D
    tiltLayer.style.transform = `
      perspective(900px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale(1.02)
    `

    // Actualizamos posición del brillo (glare)
    tiltLayer.style.setProperty("--glare-x", `${x}px`)
    tiltLayer.style.setProperty("--glare-y", `${y}px`)
  })
}

// ============================================================================
// RESET DEL TILT (INCLINACIÓN)
// ============================================================================

// Restablece el estado visual de todas las cards cuando el cursor
// sale de la grilla, eliminando rotación y centrando el efecto de brillo.

// Esto evita que la card quede inclinada cuando el mouse ya no está
// encima del elemento.

function resetAllCards(e: MouseEvent) {
  const grid = e.currentTarget as HTMLElement

  grid.querySelectorAll(".tilt-layer").forEach(el => {
    const element = el as HTMLElement

    element.style.transform = `
      perspective(900px)
      rotateX(0deg)
      rotateY(0deg)
      scale(1)
    `

    element.style.setProperty("--glare-x", "50%")
    element.style.setProperty("--glare-y", "50%")
  })

  // Limpiamos referencia para evitar estados inconsistentes
  lastTilted = null
}

</script>

<template>

  <div v-if="isLoading" class="cinema-loading">

    <div class="scan-line"></div>

    <div class="loading-title">
      {{ t('common.searchingMovies') }}
    </div>

    <div class="loading-bar">
      <div class="loading-progress"></div>
    </div>

  </div>

  <div v-else-if="error" class="empty-state">

    <div class="empty-visual">

      <div class="halo"></div>

      <!-- icono -->
      <svg class="film-icon" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="24" stroke="currentColor" stroke-width="2"/>
        <line x1="20" y1="20" x2="44" y2="44" stroke="currentColor" stroke-width="2"/>
        <line x1="44" y1="20" x2="20" y2="44" stroke="currentColor" stroke-width="2"/>
      </svg>

    </div>

    <h2 class="empty-title">
      {{ t("common.errorTitle") }}
    </h2>

    <p class="empty-description">
      {{ t("common.errorMessage") }}
    </p>

  </div>

  <div name="movie">
    
    <div v-if="validMovies.length">

        <div name="movie" class="movies-grid"             
             @mousemove="handleGridMouseMove"
             @mouseleave="resetAllCards">
        
          <MovieCard
            v-for="(movie, index) in validMovies"
            :key="movie.id"
            :movie="movie"
            :delay="index * 30"                                   
          />

        </div>

      <div ref="loadMoreTrigger" class="scroll-sentinel"></div>

      <button 
        v-if="!autoScrollEnabled && hasNextPage && !isFetchingNextPage"
             @click="enableScroll"
             class="load-more-btn"
        >
        <span class="btn-glow"></span>
        <span class="btn-text">
          {{ t("common.showMore") }}
        </span>
      </button>

    </div>

    <div v-else-if="hasProcessedData && validMovies.length === 0" class="empty-state">

      <div class="projector-flash"></div>

      <!-- film grain -->
      <div class="film-grain"></div>

      <div class="empty-visual">

        <!-- projector rays -->
        <div class="projector-rays"></div>

        <!-- halo -->
        <div class="halo"></div>
        
        <!-- icono de proyector de cine -->
        <svg class="film-icon" viewBox="0 0 64 64" fill="none">

          <!-- reels -->
          <circle cx="18" cy="18" r="8" stroke="currentColor" stroke-width="2"/>
          <circle cx="18" cy="18" r="2" fill="currentColor"/>

          <circle cx="38" cy="14" r="6" stroke="currentColor" stroke-width="2"/>
          <circle cx="38" cy="14" r="1.6" fill="currentColor"/>

          <!-- projector body -->
          <rect x="10" y="24" width="30" height="16" rx="3"
                stroke="currentColor" stroke-width="2"/>

          <!-- lens -->
          <rect x="40" y="28" width="8" height="8" rx="2"
                stroke="currentColor" stroke-width="2"/>

          <!-- tripod -->
          <line x1="20" y1="40" x2="14" y2="50"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"/>

          <line x1="30" y1="40" x2="36" y2="50"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"/>

          <!-- light beam -->
          <path
            d="M48 30 L60 26 L60 38 Z"
            fill="currentColor"
            opacity="0.35"
          />

        </svg>

        <!-- particles -->
        <div class="particles">
          <span v-for="n in 14" :key="n"></span>
        </div>

      </div>

      <h2 class="empty-title">
        {{ t("common.emptyResultsTitle") }}
      </h2>

      <p class="empty-description">
        {{ t("common.emptyResultsLine1") }} <br>
        {{ t("common.emptyResultsLine2")  }}
      </p>

    </div>

  </div>
</template>

<style scoped>

/* ==========================================================================
   GRILLA DE PELICULAS
   --------------------------------------------------------------------------
   Grid principal donde se renderizan las tarjetas de películas.
   Se utiliza perspective para dar profundidad a animaciones 3D.
   ========================================================================== */

.movies-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
  perspective: 1000px;
  position:relative;
}

/* ==========================================================================
   CONTENEDOR EMPTY-STATE 
   --------------------------------------------------------------------------
   Contenedor principal que reemplaza la grilla cuando no hay resultados.
   No usamos una "card" tradicional para evitar romper la estética espacial
   cinematográfica de la UI. Todo el contenido flota sobre el fondo.
   ========================================================================== */

.empty-state{

  position:relative;

  /* ocupa todo el ancho disponible del contenedor */
  width:100%;

  /* altura mínima para mantener presencia visual */
  min-height:560px;

  /* layout vertical centrado */
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;

  /* alineación del texto */
  text-align:center;

  /* separación entre elementos */
  gap:18px;

  /* oculta elementos visuales que sobresalen (rayos, partículas) */
  overflow:hidden;

  isolation:isolate;
 
  /* eliminamos completamente la estética de "card" */
  background:transparent;
  border:none;
  box-shadow:none;
  backdrop-filter:none;

  /* animación de aparición cinematográfica */
  animation:cinematicReveal .9s cubic-bezier(.22,.61,.36,1);
}

/* ==========================================================================
   VISUAL 
   --------------------------------------------------------------------------
   Área central donde vive el icono de película, halo y rayos.
   ========================================================================== */

.empty-visual{

  position:relative;

  width:180px;
  height:180px;

  display:flex;
  align-items:center;
  justify-content:center;
}

/* ==========================================================================
   RAYOS
   --------------------------------------------------------------------------
   Rayos rotatorios que simulan luz proyectada alrededor del icono.
   ========================================================================== */

.projector-rays{

  position:absolute;

  width:300px;
  height:300px;

  background:
  conic-gradient(
    from 180deg,
    rgba(124,58,237,.35),
    transparent 20%,
    rgba(229,9,20,.25),
    transparent 45%,
    rgba(124,58,237,.35),
    transparent 70%
  );

  filter:blur(35px);

  /* rotación continua */
  animation:raysRotate 20s linear infinite;
}


/* ==========================================================================
   HALO GLOW
   --------------------------------------------------------------------------
   Halo luminoso detrás del icono para reforzar el foco visual.
   ========================================================================== */

.halo{

  position:absolute;

  width:160px;
  height:160px;

  border-radius:50%;

  background:
  radial-gradient(
    circle,
    rgba(124,58,237,.45),
    rgba(124,58,237,.15),
    transparent 70%
  );

  filter:blur(30px);

  /* respiración luminosa */
  animation:haloPulse 6s ease-in-out infinite;
}

/* ==========================================================================
   ICONO
   --------------------------------------------------------------------------
   Icono SVG que representa una cinta de película.
   ========================================================================== */

.film-icon{

  width:70px;
  height:70px;

  color:#c084fc;

  /* glow neon */
  filter:
  drop-shadow(0 0 10px rgba(124,58,237,.7))
  drop-shadow(0 0 35px rgba(229,9,20,.3));

  /* icono flotando */
  animation:iconFloat 4s ease-in-out infinite;
}

/* ==========================================================================
   TITULO 
   ========================================================================== */

.empty-title{

  font-family:"Orbitron", sans-serif;
  font-size:31px;
  font-weight:700;

  background:linear-gradient(
    90deg,
    #ffffff,
    #c084fc
  );

   background-clip:text;           /* estándar */
  -webkit-background-clip:text;   /* Chrome / Safari */
  -webkit-text-fill-color:transparent;

  letter-spacing:.3px;

  text-shadow:
    0 0 10px rgba(124,58,237,.35),
    0 0 30px rgba(124,58,237,.15);
}

/* ==========================================================================
   DESCRIPCION 
   ========================================================================== */

.empty-description{
  
  font-size:16px;
  font-weight:600;     
  color:#e2e8ff;       /* un poco más claro */
  max-width:420px;
  line-height:1.7;
  opacity:.95;
 
}

/* ==========================================================================
   PARTICLES
   --------------------------------------------------------------------------
   Pequeñas partículas flotando que refuerzan el ambiente espacial.
   ========================================================================== */

.particles span{

  position:absolute;

  width:4px;
  height:4px;

  border-radius:50%;

  opacity:.8;

  animation:particleFloat 7s linear infinite;
}

.particles span:nth-child(odd){
  background:#c084fc;
}

.particles span:nth-child(even){
  background:#ef4444;
}

/* posiciones manuales de las partículas */

.particles span:nth-child(1){top:10%;left:10%}
.particles span:nth-child(2){top:20%;left:80%}
.particles span:nth-child(3){top:60%;left:15%}
.particles span:nth-child(4){top:70%;left:75%}
.particles span:nth-child(5){top:40%;left:90%}
.particles span:nth-child(6){top:80%;left:50%}
.particles span:nth-child(7){top:30%;left:5%}
.particles span:nth-child(8){top:15%;left:65%}
.particles span:nth-child(9){top:85%;left:30%}
.particles span:nth-child(10){top:50%;left:70%}
.particles span:nth-child(11){top:75%;left:40%}
.particles span:nth-child(12){top:35%;left:25%}
.particles span:nth-child(13){top:55%;left:85%}
.particles span:nth-child(14){top:5%;left:50%}

/* ==========================================================================
   ANIMACIONES
   ========================================================================== */

/* entrada cinematográfica */

@keyframes cinematicReveal{

  from{
    opacity:0;
    transform:translateY(50px) scale(.95);
  }

  to{
    opacity:1;
    transform:translateY(0) scale(1);
  }

}

/* icono flotando */
@keyframes iconFloat{

  0%,100%{transform:translateY(0)}
  50%{transform:translateY(-10px)}

}

/* respiración del halo */
@keyframes haloPulse{

  0%,100%{
    transform:scale(1);
    opacity:.7;
  }

  50%{
    transform:scale(1.25);
    opacity:.35;
  }

}

/* movimiento vertical de partículas */
@keyframes particleFloat{

  /* nace invisible */
  0%{
    transform:translateY(10px) scale(.8);
    opacity:0;
  }

  /* fade-in suave */
  15%{
    opacity:.9;
  }

  /* parte visible flotando */
  70%{
    opacity:.9;
  }

  /* fade-out */
  100%{
    transform:translateY(-80px) scale(1);
    opacity:0;
  }

}

/* rotación de rayos */
@keyframes raysRotate{

  from{
    transform:rotate(0deg);
  }

  to{
    transform:rotate(360deg);
  }

}

/* movimiento del grano cinematográfico */
@keyframes grainMove{

  0%{transform:translate(0,0)}
  25%{transform:translate(-1px,1px)}
  50%{transform:translate(1px,-1px)}
  75%{transform:translate(-1px,-1px)}
  100%{transform:translate(1px,1px)}
}

/* xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  
   PANTALLA DE CARGA
   xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx */

/* ==========================================================================
   CONTENEDOR PRINCIPAL DEL LOADER
   Centra todo el contenido del estado "loading"
   ========================================================================== */

.cinema-loading{

  min-height:560px;            /* altura mínima del bloque de carga */
  display:flex;
  flex-direction:column;       /* elementos apilados verticalmente */
  align-items:center;          /* centrado horizontal */
  justify-content:center;      /* centrado vertical */
  gap:26px;                    /* separación entre texto y barra */
  position:relative;           /* necesario para posicionar la scan-line */

}

/* ==========================================================================
   TEXTO DEL LOADING
   Mensaje tipo sci-fi estilo interfaz futurista
   ========================================================================== */

.loading-title{

  font-family:"Orbitron", sans-serif;  /* tipografía tecnológica */
  font-size:20px;
  color:#c084fc;                     /* violeta principal del theme */
  letter-spacing:.15em;                /* espacio entre letras estilo HUD */
  text-transform:uppercase;
  /* glow suave para integrarlo con el fondo luminoso */
  text-shadow:
    0 0 12px rgba(124,58,237,.6),
    0 0 35px rgba(124,58,237,.3);

}

/* ==========================================================================
   CONTENEDOR DE LA BARRA DE CARGA
   ========================================================================== */

.loading-bar{

  width:360px;
  height:8px;
  border-radius:8px;                   /* bordes suaves */
  background:rgba(255,255,255,.06);  /* fondo de la barra de carga */
  overflow:hidden;                     /* oculta desbordes del progreso */
  /* halo luminoso para efecto futurista */
  box-shadow:
    0 0 15px rgba(124,58,237,.4);

}

/* ==========================================================================
   PROGRESO ANIMADO
   Barra que se expande y contrae mientras se mueve el gradiente
   ========================================================================== */

.loading-progress{

  height:100%;
  width:40%;                           /* valor inicial */
  /* gradiente animado tipo energía */
  background:linear-gradient(
    90deg,
    #7c3aed,
    #ef4444,
    #7c3aed
  );
  background-size:200% 100%;
  /* dos animaciones simultáneas */
  animation:
    progressMove 2.4s linear infinite,     /* movimiento del gradiente */
    progressWidth 3s ease-in-out infinite; /* expansión falsa de carga */

}

/* ==========================================================================
   LÍNEA DE ESCANEO
   Simula un escáner tipo radar o interfaz holográfica
   ========================================================================== */

.scan-line{

  position:absolute;
  width:500px;
  height:2px;
  /* brillo central con desvanecimiento lateral */
  background:linear-gradient(
    90deg,
    transparent,
    rgba(124,58,237,.9),
    transparent
  );
  animation:scanMove 3s linear infinite;

}

/* ==========================================================================
   ANIMACIONES
   ========================================================================== */

/* movimiento del gradiente dentro de la barra */
@keyframes progressMove{

  to{
    background-position:-200% 0;
  }

}

/* expansión y contracción del progreso
   simula carga mientras espera la API */
@keyframes progressWidth{

  0%{width:15%}
  50%{width:85%}
  100%{width:15%}

}

/* desplazamiento vertical de la línea de escaneo */
@keyframes scanMove{

  0%{
    transform:translateY(-120px);
    opacity:.2;
  }

  50%{
    opacity:1;
  }

  100%{
    transform:translateY(120px);
    opacity:.2;
  }
}

/* ==========================================================================
   BOTÓN MOSTRAR MÁS (CINEMATIC UI)
   ========================================================================== */

.load-more-btn{

  position:relative;

  margin:60px auto 20px;
  padding:14px 36px;

  display:flex;
  align-items:center;
  justify-content:center;

  font-family:"Orbitron", sans-serif;
  font-size:14px;
  letter-spacing:.12em;
  text-transform:uppercase;

  color:#e9d5ff;

  background:rgba(124,58,237,.08);
  border:1px solid rgba(124,58,237,.4);

  border-radius:12px;

  cursor:pointer;

  overflow:hidden;
  isolation:isolate;

  transition:all .35s ease;

  box-shadow:
    0 0 10px rgba(124,58,237,.3),
    inset 0 0 12px rgba(124,58,237,.15);
}

/* glow interno animado */

.btn-glow{
  position:absolute;
  inset:0;

  background:linear-gradient(
    120deg,
    transparent,
    rgba(124,58,237,.6),
    rgba(239,68,68,.5),
    transparent
  );

  opacity:.25;
  filter:blur(20px);

  animation:btnGlowMove 6s linear infinite;
}

/* texto por encima */

.btn-text{
  position:relative;
  z-index:2;
}

/* hover */

.load-more-btn:hover{

  transform:scale(1.01);

  border-color:#c084fc;

  box-shadow:
    0 0 18px rgba(124,58,237,.6),
    0 0 40px rgba(239,68,68,.25),
    inset 0 0 16px rgba(124,58,237,.25);
}

/* active */

.load-more-btn:active{
  transform:scale(.97);
}

/* animación glow */

@keyframes btnGlowMove{
  0%{
    transform:translateX(-100%);
  }
  100%{
    transform:translateX(100%);
  }
}

/* ==========================================================================
   SCROLL SENTINEL
   --------------------------------------------------------------------------
   Elemento invisible utilizado por el IntersectionObserver para detectar
   cuándo el usuario llegó al final de la grilla.

   Funciona como un "trigger":
   - Se coloca al final de la lista de películas.
   - Cuando entra en el área visible (o dentro del rootMargin),
     el observer dispara la carga de más resultados.

   IMPORTANTE:
   - No tiene contenido visual.
   - Solo necesita un tamaño mínimo para ser detectable.
   - Su altura (40px) asegura que el observer tenga un área suficiente
     para activarse correctamente.

   Sin este elemento, el infinite scroll no podría funcionar.
   ========================================================================== */
   
.scroll-sentinel{
  height:40px;
  width:100%;
}

</style>