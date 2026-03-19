<script setup lang="ts">

/* ============================================================================
 *  MovieFilters.vue
 * ============================================================================
 *
 * Componente encargado de mostrar y gestionar todos los filtros de películas.
 *
 * Funciones principales:
 * 
 * 1. Permite filtrar películas por:
 *    - Tipo de listado (discover, popular, now_playing, upcoming, top_rated)
 *    - Texto de búsqueda
 *    - Rango de años
 *    - Rango de rating
 *    - Géneros
 *    - Orden (sortBy)
 *
 * 2. Reacciona automáticamente a cambios en la URL (query param "search"),
 *    reseteando filtros y aplicando el texto de búsqueda correspondiente.
 *
 * 3. Maneja sliders de años y rating, actualizando los filtros reactivos
 *    cuando el usuario termina de interactuar.
 *
 * 4. Permite personalizar el orden de los paneles mediante drag & drop.
 *    - Paneles: list, filters, genres, sort
 *    - Modo personalización activable con toggle
 *
 * 5. Implementa efectos visuales en los paneles:
 *    - Tilt 3D / magnetic hover siguiendo la posición del cursor
 *    - Reset del tilt al salir del panel
 *
 * 6. Control de scroll del contenedor de filtros:
 *    - Detecta overflow vertical
 *    - Muestra botones ▲ ▼ según corresponda
 *    - Scroll continuo al mantener presionados los botones
 *
 * 7. Integración con Multiselect:
 *    - Previene abrir dropdowns si el panel está deshabilitado
 *    - Ajusta scroll y padding para asegurar visibilidad del último panel
 *
 * 8. Gestión de estado reactivo:
 *    - props.movieFilters: objeto reactivo con todos los filtros
 *    - openPanels: controla la apertura/cierre de cada panel
 *    - customizingPanels: modo personalización
 *
 * 9. Optimización:
 *    - requestAnimationFrame para efectos 3D suaves
 *    - ResizeObserver y listener de resize para actualizar overflow y scroll
 *
 * Este componente está pensado para ser completamente interactivo y dinámico,
 * garantizando una UX fluida y visualmente atractiva en el panel de filtros
 * de la vista de películas.
 */

// Importamos utilidades reactivas de Vue
import { computed, ref, watch } from "vue";

// Hook de internacionalización para traducir textos
import { useI18n } from "vue-i18n";

// Slider para seleccionar rango de rating
import VueSlider from "vue-slider-component";
import "vue-slider-component/theme/default.css";

// Librería para permitir drag & drop (reordenar paneles)
import draggable from "vuedraggable";

// Query que obtiene los géneros de películas desde la API
import { useMovieGenresQuery } from "@/features/movies/composables/useMoviesGenresQuery";

// Tipado del objeto de filtros
import type { MovieFilters } from "@/features/movies/composables/useMoviesFilters";

// Uso del select de vue
import Multiselect from "vue-multiselect";
import "vue-multiselect/dist/vue-multiselect.css";

// Recibimos desde el componente padre el objeto reactivo con todos los filtros
const props = defineProps<{
  movieFilters: MovieFilters;
}>();

// Desestructuramos los filtros para usarlos directamente en el template
const {
  listType, // Listado de tipo de peliculas
  txtMovie, // texto de búsqueda
  yearFrom, // año desde
  yearTo, // año hasta
  ratingRange, // rango de rating [min,max]
  selectedGenres, // géneros seleccionados
  sortBy, // criterio de ordenamiento
} = props.movieFilters;

/* --------------------------------------------------------------------------------------------------- */

import { useRoute } from "vue-router"

// Acceso a la información de la URL actual.
// Permite leer parámetros como: /movies?search=terror
const route = useRoute()

// Observa cambios en el parámetro `search` de la URL.
// Se ejecuta cuando el usuario realiza una búsqueda desde el header
// o cuando la URL cambia mediante el router.
watch(
  () => route.query.search,

  // value  → nuevo valor del query param
  // oldValue → valor anterior
  (value, oldValue) => {

    // Normaliza el valor recibido desde la URL.
    // Si "search" no es string (puede ser undefined o array),
    // se reemplaza por string vacío para evitar errores.
    const query = typeof value === "string" ? value : ""

    // Solo reaccionamos cuando:
    // 1) Existe un texto de búsqueda
    // 2) Ese texto cambió respecto al anterior
    // Esto evita resets innecesarios o loops.
    if (query && query !== oldValue) {

      // Resetea todos los filtros del panel (géneros, años, rating, orden, etc).
      // La idea es que una búsqueda nueva empiece sin filtros previos.
      resetFilters()

      // Después del reset, volvemos a colocar el texto proveniente
      // del header en el campo de búsqueda del panel.
      // Si no se hace esto, resetFilters() podría haber limpiado el input.
      txtMovie.value = query

    }

  }
)

/* --------------------------------------------------------------------------------------------------- */

// Hook de i18n para obtener traducción
const { t, locale } = useI18n();

// Ejecuta la query para traer los géneros según el idioma actual
const { data: movieGenres } = useMovieGenresQuery(locale);

// Computed que asegura devolver siempre un array
// (si la API aún no respondió devuelve [])
const genres = computed(() => movieGenres.value ?? []);

// Los demas filtros solamente se habilitan si el listado es discover
const filtersEnabled = computed(() => listType.value === "discover");

/* Si se deshabilitan los filtros estos se resetean */
watch(filtersEnabled, (enabled) => {
  // Si los filtros estan deshabilitados resetear filtros menos el combo de listado
  if (!enabled) {
    resetFiltersExceptList();
  }
});

// Opciones por defecto al cargar la pagina de peliculas
yearFrom.value = 1900;
yearTo.value = new Date().getFullYear();
// Mejor rating
sortBy.value = "vote_average.desc";

// ==============================
// Listado de tipos
// ==============================

import type { MovieListType } from "@/features/movies/types/movie-list-type";

type ListTypeOption = {
  label: string;
  value: MovieListType;
};

const listTypesOptions = computed<ListTypeOption[]>(() => [
  { label: t("filters.typesOptions.discover"), value: "discover" },
  { label: t("filters.typesOptions.popular"), value: "popular" },
  { label: t("filters.typesOptions.now_playing"), value: "now_playing" },
  { label: t("filters.typesOptions.upcoming"), value: "upcoming" },
  { label: t("filters.typesOptions.top_rated"), value: "top_rated" },
]);

// ==============================
// Lista de ordenar
// ==============================

type SortOption = {
  label: string;
  value: string;
};

const sortOptions = computed<SortOption[]>(() => [
  { label: t("filters.sortOptions.mostPopular"), value: "popularity.desc" },
  { label: t("filters.sortOptions.mostRecent"), value: "release_date.desc" },
  { label: t("filters.sortOptions.oldest"), value: "release_date.asc" },
  { label: t("filters.sortOptions.bestRating"), value: "vote_average.desc" },
]);

// ============================================================
// ESTADO DEL SLIDER DE RATING
// Guarda el rango seleccionado en el slider
// [ratingMin, ratingMax]
// ============================================================

const sliderRating = ref([
  // Si ya existe un valor en el filtro lo usamos
  // si no, arrancamos en 0
  ratingRange.value?.[0] ?? 0,

  // Si existe el máximo lo usamos
  // si no, el máximo permitido es 10
  ratingRange.value?.[1] ?? 10,
]);

// ============================================================
// FUNCIÓN QUE ACTUALIZA EL FILTRO DE RATING

// Esta función toma los valores actuales del slider de rating
// y los guarda en el objeto de filtros reactivo.
// Se ejecuta cuando el usuario termina de mover el slider (@drag-end).
// ============================================================

function applyRatingFilter() {
  // Extraemos los valores del slider
  const [min, max] = sliderRating.value;

  // Actualizamos el filtro real
  // Si algo viene undefined lo convertimos a un valor por defecto
  ratingRange.value = [min ?? 0, max ?? 10];
}

// ============================================================
// CONST QUE GENERA LAS MARCAS DEL SLIDER DE RATING
// ============================================================

// Esta constante computada genera un objeto con las marcas del slider de rating.
// Cada marca tiene un label que se muestra en la UI (0 a 10) para indicar el valor.
const ratingMarks = computed(() => {
  const marks: Record<number, any> = {};

  // Creamos marcas de 0 a 10
  for (let r = 0; r <= 10; r++) {
    marks[r] = {
      label: String(r),
    };
  }

  return marks;
});

// ============================================================
// ESTADO DEL SLIDER DE AÑOS
// ============================================================

// sliderYears guarda el rango de años que maneja el slider.
// Siempre contiene dos valores: [añoInicio, añoFin]

const sliderYears = ref([
  // Si yearFrom.value tiene valor se usa ese.
  // Si es null o undefined se usa 1900 como año inicial por defecto.
  yearFrom.value ?? 1900,

  // Si yearTo.value tiene valor se usa ese.
  // Si no existe se usa el año actual como límite superior.
  yearTo.value ?? new Date().getFullYear(),
]);

// ============================================================
// FUNCIÓN QUE APLICA FILTRO DE AÑOS

// Esta función se ejecuta cuando el usuario termina de mover el slider
// de rango de años
// (por ejemplo usando el evento @drag-end del slider).
// Toma los valores actuales del slider y los copia a los filtros reales.
// ============================================================

function applyYearFilter() {
  // Desestructuración del array del slider
  // from = año inicial
  // to   = año final
  const [from, to] = sliderYears.value;

  // Guardamos los valores en los filtros.
  // Si por alguna razón llega undefined, lo convertimos a null
  // para mantener consistencia con el tipo de los filtros.
  yearFrom.value = from ?? null;
  yearTo.value = to ?? null;

  // Obtener el elemento que actualmente tiene el foco en el documento.
  // En algunos casos, después de arrastrar el slider, el handle queda enfocado
  // y el tooltip permanece visible mientras exista ese focus.
  const el = document.activeElement as HTMLElement;

  // Si hay un elemento enfocado, forzamos blur() para quitarle el foco.
  // Esto ayuda a que el tooltip del slider desaparezca inmediatamente
  // después de terminar el drag. Aunque solo desaparece al sacar el mouse del slider
  if (el) el.blur();
}

// ============================================================
// MARCAS DEL SLIDER (TICKS)
// ============================================================

// decadeMarks genera automáticamente las marcas visuales
// que aparecen en el slider (las pequeñas líneas verticales).
const decadeMarks = computed(() => {
  // Objeto donde se guardan las marcas
  // clave = valor del slider
  // valor = configuración de la marca
  const marks: Record<number, any> = {};

  // Año máximo permitido (año actual)
  const max = new Date().getFullYear();

  // Generamos marcas cada 20 años
  // 1900, 1920, 1940, 1960, etc.
  for (let y = 1900; y <= max; y += 20) {
    marks[y] = {
      label: "", // sin texto para no saturar la UI
    };
  }

  // Primera marca con etiqueta visible
  marks[1900] = { label: "1900" };

  // Última marca con el año actual
  marks[max] = { label: String(max) };

  // Devolvemos el objeto de marcas que el slider usará
  return marks;
});

// ====================================================
// PANELES
// ====================================================

let rect: DOMRect;
let frame = 0;
let mouseX = 0;
let mouseY = 0;

// Tipos posibles de paneles del sidebar
type PanelId = "list" | "filters" | "genres" | "sort";

// Lista de paneles que se renderizan en el sidebar
// Este array se puede reordenar con drag & drop
const panels = ref<PanelId[]>(["list", "filters", "genres", "sort"]);

const panelTitles = computed(() => ({
  list: t("filters.panels.list"),
  filters: t("filters.panels.filters"),
  genres: t("filters.panels.genres"),
  sort: t("filters.panels.sort"),
}));

// Controla si el usuario está en modo "personalizar paneles"
const customizingPanels = ref(false);

watch(customizingPanels, (isCustomizing) => {
  if (isCustomizing) {
    // cerrar todos los paneles
    Object.keys(openPanels.value).forEach((id) => {
      openPanels.value[id as PanelId] = false;
    });
  }
});

// ============================================================
// FUNCIÓN QUE ALTERNA EL MODO DE PERSONALIZACIÓN DE PANEL

// Esta función activa o desactiva el modo "personalizar paneles".
// Cuando está activo, los paneles del sidebar se pueden arrastrar
// y reordenar mediante drag & drop. Al desactivarlo, los paneles
// vuelven a su comportamiento normal (sin poder arrastrar).
// ============================================================

function toggleCustomizePanels() {
  customizingPanels.value = !customizingPanels.value;
}

// Estado de apertura/cierre de cada panel
const openPanels = ref<Record<PanelId, boolean>>({
  filters: true,
  genres: true,
  sort: true,
  list: true,
});

// ============================================================================
// FUNCIÓN PARA ALTERNAR EL ESTADO DE UN PANEL

// Alterna el estado de un panel (abre si está cerrado, cierra si está abierto).
// Recibe el id del panel y cambia su estado en el objeto reactivo `openPanels`.
// ============================================================================

// Abre o cierra un panel específico
function togglePanel(id: PanelId) {
  openPanels.value[id] = !openPanels.value[id];
}

/* -------------------------------------------------------------------------------------------------- */

// ============================================================================
// FUNCIÓN DE DETECCIÓN DE ENTRADA DEL CURSOR AL PANEL

// Esta función se ejecuta cuando el cursor entra dentro del panel.

// Su propósito es obtener y guardar el rectángulo del panel en pantalla
// (posición y tamaño) para poder calcular correctamente la posición
// del mouse dentro del elemento.
//
// Qué ocurre exactamente:
//     Cuando el mouse entra al panel:
//         Se obtiene el elemento que disparó el evento.
//         Se calcula su bounding box en la pantalla.
//         Se guarda esa información en `rect`.
//
// Para qué se usa:
//     Durante el movimiento del mouse (mousemove),
//     esta información permite calcular:
//
//         posición del cursor dentro del panel
//         distancia respecto al centro
//         intensidad del tilt 3D
//
// Resultado:
//     Permite que el cálculo del efecto 3D sea preciso y eficiente,
//     evitando recalcular el tamaño del panel en cada movimiento del mouse.
// ============================================================================

function handlePanelMouseEnter(e: MouseEvent) {
  // Obtiene el elemento del panel que disparó el evento
  const panel = e.currentTarget as HTMLElement;

  // Calcula la posición y dimensiones del panel en la pantalla
  // (top, left, width, height, etc.)
  rect = panel.getBoundingClientRect();
}

// ============================================================================
// FUNCIÓN DE HOVER MAGNÉTICO / TILT 3D DEL PANEL

// Implementa el efecto visual "Magnetic Panel Tilt", donde el panel se inclina
// levemente en 3D siguiendo la posición del cursor dentro del elemento.

// El efecto da la sensación de que el panel reacciona magnéticamente al mouse,
// como si estuviera flotando en el espacio.

// Responsabilidad: calcular y aplicar el efecto 3D.

// Qué ocurre exactamente:
// Cuando el mouse se mueve dentro del panel:
//     Se detecta la posición del cursor dentro del panel.
//     Se calcula la distancia respecto al centro.
//     En base a esa distancia se aplica un rotateX y rotateY.

// Resultado visual:
//     si el cursor está arriba  → el panel se inclina hacia arriba
//     si está a la izquierda    → se inclina hacia la izquierda
//     si está abajo/derecha     → se inclina hacia abajo o derecha
//
// Esto genera profundidad visual y una interacción más dinámica.
// ============================================================================

function handlePanelMouseMove(e: MouseEvent) {
  // Elemento del panel que está recibiendo el evento de mouse
  const panel = e.currentTarget as HTMLElement;

  // Posición actual del cursor en la ventana (viewport)
  mouseX = e.clientX;
  mouseY = e.clientY;

  // Evita ejecutar múltiples cálculos por cada evento mousemove
  // Si aún no hay un frame programado, se agenda uno con requestAnimationFrame
  // para actualizar el efecto 3D en el próximo ciclo de render del navegador
  if (!frame) {
    frame = requestAnimationFrame(() => updateTilt(panel));
  }
}

// ============================================================================
// FUNCIÓN DE CÁLCULO Y APLICACIÓN DEL TILT 3D DEL PANEL

// Esta función calcula la inclinación 3D del panel en base a la posición
// actual del cursor dentro del elemento.
//
// Flujo:
//     1. Calcula la posición del cursor dentro del panel.
//     2. Determina la distancia del cursor respecto al centro.
//     3. Convierte esa distancia en una rotación proporcional.
//     4. Limita la rotación con un máximo para evitar inclinaciones extremas.
//     5. Aplica el transform 3D al panel.
// ============================================================================

function updateTilt(panel: HTMLElement) {
  // Posición del cursor relativa al panel
  const x = mouseX - rect.left;
  const y = mouseY - rect.top;

  // Centro del panel
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  // Inclinación máxima permitida en grados
  const maxTilt = 8;

  // Cálculo de rotación vertical (eje X)
  // Se normaliza la distancia del cursor respecto al centro
  const rotateX = Math.max(
    Math.min(((y - centerY) / centerY) * -maxTilt, maxTilt),
    -maxTilt,
  );

  // Cálculo de rotación horizontal (eje Y)
  const rotateY = Math.max(
    Math.min(((x - centerX) / centerX) * maxTilt, maxTilt),
    -maxTilt,
  );

  // Aplicación del transform 3D al panel
  panel.style.transform = `
            perspective(900px)
            translateY(0px)
            translateZ(0px)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
        `;

  // Variables CSS con la posición del cursor dentro del panel
  // (pueden usarse para efectos visuales como brillo o gradientes)
  panel.style.setProperty("--x", `${x}px`);
  panel.style.setProperty("--y", `${y}px`);

  // Libera el frame para permitir el próximo requestAnimationFrame
  frame = 0;
}

// ============================================================================
// FUNCIÓN DE RESET DEL TILT DEL PANEL

// Esta función se ejecuta cuando el cursor sale del panel (mouseleave).

// Su objetivo es devolver el panel a su posición normal,
// eliminando cualquier inclinación 3D que se haya aplicado
// durante el movimiento del mouse.
//
// Si no se hiciera esto, el panel quedaría inclinado en el
// último ángulo calculado por el efecto "Magnetic Panel Tilt".
// ============================================================================

function resetPanelTilt(e: MouseEvent) {
  // e.currentTarget hace referencia al elemento que disparó el evento,
  // en este caso el panel que tiene el efecto de tilt
  const panel = e.currentTarget as HTMLElement;

  // Si el mouse sale rápido:
  // puede quedar un requestAnimationFrame pendiente
  // el panel hace un micro salto
  // Esto lo evita.
  if (frame) {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  // Se restablece la transformación CSS del panel.
  // perspective mantiene el contexto 3D,
  // pero las rotaciones vuelven a 0 para que el panel
  // recupere su posición completamente plana.
  panel.style.transform = `
        perspective(900px)
        rotateX(0deg)
        rotateY(0deg)
        `;
}

/* -------------------------------------------------------------------------------------------------- */

// ============================================================================
// RESET DE LOS FILTROS
// ============================================================================

// Resetea los filtros menos el combo de listado si se deshabilitan paneles ya que si
// agregamos el listado se romperia el combo porque siempre volveria a discover
const resetFiltersExceptList = () => {
  txtMovie.value = "";
  yearFrom.value = null;
  yearTo.value = null;
  ratingRange.value = [0, 10];
  selectedGenres.value = [];
  sortBy.value = "vote_average.desc";
  sliderYears.value = [1900, new Date().getFullYear()];
  sliderRating.value = [0, 10];
};

// Resetea todos los filtros a su estado inicial
const resetFilters = () => {
  listType.value = "discover";
  resetFiltersExceptList();
};

/* -------------------------------------------------------------------------------------------------- */

// ============================================================================
// ESTADO DE SCROLL DEL CONTENEDOR
// ============================================================================

// Indica si existe contenido por encima del scroll actual.
// Controla la visibilidad del botón ▲
const canScrollUp = ref(false);

// Indica si existe contenido por debajo del scroll actual.
// Controla la visibilidad del botón ▼
const canScrollDown = ref(false);

// Esta variable reactiva almacena un booleano que indica si el contenedor
// de filtros tiene overflow vertical. Es decir, si su contenido total
// excede la altura visible y por lo tanto se puede scrollear.
// Se usa para mostrar/ocultar botones de navegación ▲ ▼ de manera dinámica.
const hasOverflow = ref(false);

// ============================================================================
// REFERENCIA AL CONTENEDOR DE FILTROS
// ============================================================================

// Apunta al elemento DOM que contiene todos los paneles de filtros.
// Este contenedor tiene overflow vertical y puede desplazarse.
//
// Se usa para:
//
// - leer la posición actual del scroll
// - desplazar el panel programáticamente
// - controlar los botones ▲ ▼ de navegación

const filtersRef = ref<HTMLElement | null>(null);

// ============================================================================
// FUNCIÓN DE DETECCIÓN DE POSICIÓN DE SCROLL

// Esta función verifica la posición actual del scroll dentro del contenedor
// de filtros para determinar si deben mostrarse los botones de navegación.
//
// Lógica:
//
//  ▲ aparece solo si hay contenido arriba
//  ▼ aparece solo si hay contenido abajo
// ============================================================================

function checkScrollPosition() {
  /* el es el contenedor que tiene el scroll de los filtros. */
  const el = filtersRef.value;
  if (!el) return;

  // Si el scrollTop es mayor que 10px significa que hay contenido arriba
  canScrollUp.value = el.scrollTop > 10;

  // Si la suma del scroll actual + altura visible es menor al contenido total,
  // significa que todavía queda contenido debajo
  canScrollDown.value = el.scrollTop + el.clientHeight < el.scrollHeight - 10;
}

// ============================================================================
// FUNCIÓN DE DETECCIÓN DE OVERFLOW DEL CONTENEDOR

// Determina si el contenedor de filtros tiene más contenido del que puede
// mostrar en pantalla (overflow vertical).
//
// Si hay overflow se muestran los botones de navegación.
// ============================================================================

function checkOverflow() {
  const el = filtersRef.value;
  if (!el) return;

  // scrollHeight = altura total del contenido, incluyendo lo que está fuera de pantalla.
  // clientHeight = altura visible del elemento
  // Es la parte que el usuario puede ver sin scrollear.

  // Si el contenido total supera la altura visible del contenedor
  // significa que existe scroll disponible
  // Ej: scrollHeight = 1200
  //     clientHeight = 600
  // 1200 > 600 = true
  // Entonces aparecen los botones de navegación
  hasOverflow.value = el.scrollHeight > el.clientHeight;
}

// ============================================================================
// OBSERVADOR DE CAMBIOS DE TAMAÑO
// ============================================================================
//
// ResizeObserver detecta automáticamente cuando cambia el tamaño del
// contenedor de filtros o su contenido.
//
// Esto es importante porque la altura puede cambiar cuando:
//
// - se abren o cierran paneles
// - llegan datos de la API
// - se renderizan nuevos elementos
// - cambia el layout

import { onMounted, onBeforeUnmount } from "vue";

let resizeObserver: ResizeObserver | null = null;

// ============================================================================
// MONTAJE DEL COMPONENTE
// ============================================================================
//
// Se inicializan todos los listeners necesarios:
//
// 1. Scroll del contenedor
// 2. Cambios de tamaño del contenedor
// 3. Cambios de tamaño del viewport

onMounted(() => {
  const el = filtersRef.value;
  if (!el) return;

  // ------------------------------------------------------------------------
  // LISTENER DE SCROLL
  // ------------------------------------------------------------------------
  // Permite actualizar los botones ▲ ▼ cuando el usuario se desplaza
  // dentro del panel de filtros
  el.addEventListener("scroll", checkScrollPosition);

  // ------------------------------------------------------------------------
  // RESIZE OBSERVER
  // ------------------------------------------------------------------------
  // Detecta cambios en la altura del contenedor o su contenido
  resizeObserver = new ResizeObserver(() => {
    // Verifica si aparece o desaparece overflow
    checkOverflow();
    // Recalcula la posición de scroll disponible
    checkScrollPosition();
  });

  resizeObserver.observe(el);

  // ------------------------------------------------------------------------
  // RESIZE DEL VIEWPORT
  // ------------------------------------------------------------------------
  // Si cambia el tamaño de la ventana puede aparecer o desaparecer
  // el overflow del contenedor
  window.addEventListener("resize", () => {
    checkOverflow();
    checkScrollPosition();
  });

  // ------------------------------------------------------------------------
  // CHEQUEO INICIAL
  // ------------------------------------------------------------------------
  // Se ejecuta al montar el componente para inicializar correctamente
  // los estados de scroll
  checkOverflow();
  checkScrollPosition();
});

// ============================================================================
// LIMPIEZA AL DESTRUIR EL COMPONENTE
// ============================================================================
//
// Eliminamos los listeners para evitar memory leaks

onBeforeUnmount(() => {
  const el = filtersRef.value;

  if (resizeObserver && el) {
    resizeObserver.unobserve(el);
  }

  window.removeEventListener("resize", checkOverflow);
});

/* -------------------------------------------------------------------------------------------------- */

// Almacena el ID del setInterval que controla el scroll continuo.
// Sirve para poder detener el scroll cuando el usuario suelte el botón.
let scrollInterval: number | null = null;

// ============================================================================
// FUNCIÓN DE SCROLL HACIA ARRIBA

// Inicia un scroll continuo hacia arriba dentro del contenedor de filtros.
// Se ejecuta al presionar y mantener el botón ▲.
// Detiene automáticamente el scroll al llegar al tope superior.
// ============================================================================

const startScrollUp = () => {
  const el = filtersRef.value;
  if (!el) return;
  
  // Llamamos a stopScroll() antes de crear un nuevo intervalo.
  //
  // Qué hace stopScroll():
  //   1) Si ya existe un scroll automático en ejecución (scrollInterval != null),
  //      cancela ese setInterval para detener el movimiento actual.
  //   2) Resetea scrollInterval a null para indicar que no hay scroll activo.
  //
  // Por qué es necesario:
  //   - Si no lo hacemos, cada vez que el usuario presione el botón
  //     se crearían múltiples intervalos simultáneamente.
  //   - Esto provoca que el scroll vaya más rápido de lo esperado o
  //     que se comporte de forma errática (rebotes, paradas inesperadas).
  stopScroll(); 

  // setInterval es una función de JavaScript que ejecuta un bloque de código 
  // repetidamente con un intervalo de tiempo fijo.
  scrollInterval = window.setInterval(() => {

    // Se asegura de que NO haya otro scroll activo antes de crear uno nuevo.
    // Esto evita que se acumulen intervalos y el scroll vaya demasiado rápido
    // o se comporte de forma extraña.
    if (el.scrollTop <= 0) {
      stopScroll(); // llegamos al top, detener scroll
      return;
    }

    el.scrollBy({ top: -20 }); // mover hacia arriba

    checkScrollPosition(); // actualizar visibilidad de los botones de navegación
  }, 16); // ~60fps, para que se vea suave
};

// ============================================================================
// FUNCIÓN DE SCROLL HACIA ABAJO

// Inicia un scroll continuo hacia abajo dentro del contenedor de filtros.
// Se ejecuta al presionar y mantener el botón ▼.
// Detiene automáticamente el scroll al llegar al final.
// ============================================================================

const startScrollDown = () => {
  const el = filtersRef.value;
  if (!el) return;

  // Evita crear múltiples intervalos si el usuario presiona varias veces.
  stopScroll(); 
  
  scrollInterval = window.setInterval(() => {
    if (el.scrollTop + el.clientHeight >= el.scrollHeight) {
      stopScroll(); // llegamos al bottom, detener scroll
      return;
    }

    el.scrollBy({ top: 20 }); // mover hacia abajo

    checkScrollPosition(); // actualizar visibilidad de los botones ▲▼
  }, 16); // ~60fps, movimiento suave
};

// ============================================================================
// FUNCIÓN PARA DETENER EL SCROLL 

// Detiene cualquier scroll continuo que esté activo.
// Se ejecuta generalmente al soltar el botón (mouseup) o cuando el cursor sale del botón.
// Esto evita que el scroll siga ejecutándose indefinidamente.
// ============================================================================

const stopScroll = () => {
  if (scrollInterval) {
    clearInterval(scrollInterval); // Cancela el intervalo
    scrollInterval = null;         // Resetea la variable para futuros scrolls
  }
};

/* -------------------------------------------------------------------------------------------------- */

// ============================================================================
// FUNCIÓN PARA DETECTAR SI UN PANEL ES EL ÚLTIMO DEL CONTENEDOR

// Los paneles pueden cambiar de orden dinámicamente porque el usuario
// puede reordenarlos mediante drag & drop (vuedraggable).
//
// Por eso no podemos asumir que un panel específico siempre será el último.
// Esta función verifica en tiempo real si el panel actual es el último.
//
// Se utiliza principalmente para manejar comportamientos especiales en
// controles ubicados al final del contenedor (ej: dropdowns que podrían
// quedar cortados por el límite inferior del scroll).
// ============================================================================

function isLastPanel(id: PanelId) {
  // Obtiene el último panel del array reactivo "panels"
  const last = panels.value[panels.value.length - 1];

  // Compara si el id recibido corresponde al último panel
  // Devuelve true si coincide, false si no
  return last === id;
}

// ============================================================================
// FUNCIÓN QUE DEVUELVE SI UN PANEL ESTÁ DESHABILITADO

// Esta función recibe el ID de un panel y retorna `true` si el panel
// no se puede interactuar, es decir, si los filtros están deshabilitados
// y el panel no es el de tipo "list".
// Se utiliza para evitar que el usuario abra o modifique paneles cuando
// los filtros no están activos.
// ============================================================================

function isPanelDisabled(id: PanelId) {
  return !filtersEnabled.value && id !== "list";
}

// ============================================================================
// FUNCIÓN QUE IMPIDE ABRIR UN MULTISELECT

// Esta función se ejecuta cuando se intenta abrir un dropdown tipo Multiselect.
// Su objetivo es:
//   1) Comprobar si el panel donde está el Multiselect está deshabilitado.
//   2) Si está deshabilitado, evita que se abra.
//   3) Si está habilitado, ejecuta la función `onSelectOpen` para manejar
//      el scroll y padding necesario para mostrar el dropdown correctamente.
// ============================================================================

function handleOpen(element: PanelId) {
  // Si el panel donde está el Multiselect está deshabilitado
  if (isPanelDisabled(element)) return false;

  // Abrir el Multiselect y aplicar ajustes de scroll si es necesario
  onSelectOpen(element);
}

// ============================================================================
// FUNCIÓN QUE SE EJECUTA CUANDO SE ABRE UN MULTISELECT

// Problema que resuelve:
//
// Cuando un dropdown se abre en el último panel del contenedor,
// puede quedar parcialmente oculto porque el contenedor de filtros
// tiene un límite de scroll.
//
// Solución:
//
// 1) Agregar espacio extra al final del contenedor
// 2) Hacer un pequeño scroll automático
//
// Esto asegura que el dropdown abierto quede completamente visible.
// ============================================================================

function onSelectOpen(id: PanelId) {
  // Solo aplicar la lógica si el control pertenece al último panel
  if (!isLastPanel(id)) return;

  // También verificamos que el panel esté actualmente expandido
  // (si estuviera colapsado no tendría sentido hacer scroll)
  if (!openPanels.value[id]) return;

  // Referencia al contenedor scrolleable que contiene los filtros
  const el = filtersRef.value;
  if (!el) return;
  
  // Se agrega padding adicional para permitir seguir scrolleando
  // incluso cuando estamos cerca del final del contenedor.  
  el.style.paddingBottom = "320px";

  // Esperamos al siguiente frame del navegador para que el layout
  // se actualice con el nuevo padding antes de ejecutar el scroll.  
  requestAnimationFrame(() => {
    el.scrollBy({
      top: 200, // desplazamiento hacia abajo
      behavior: "smooth", // animación suave
    });
  });
}

// ============================================================================
// FUNCIÓN QUE SE EJECUTA CUANDO SE CIERRA EL MULTISELECT

// Al cerrar el dropdown ya no necesitamos el espacio extra al final
// del contenedor, por lo que restauramos el padding original.
//
// Esto evita dejar espacio vacío innecesario en el layout.
// ============================================================================

function onSelectClose(id: PanelId) {
  // Solo restaurar si el control pertenece al último panel
  if (!isLastPanel(id)) return;

  // Referencia al contenedor de filtros
  const el = filtersRef.value;
  if (!el) return;

  // Restauramos el padding original del contenedor
  el.style.paddingBottom = "80px";
}
</script>

<template>
  <div class="filters-wrapper">
    <Transition name="scroll-btn">
      <button
        v-if="hasOverflow && canScrollUp"
              class="filters-scroll up"
              @mousedown="startScrollUp"
              @mouseup="stopScroll"
              @mouseleave="stopScroll"
      >
        ▲
      </button>
    </Transition>

    <div class="filters" ref="filtersRef">
      <div class="filters-header">
        <button @click="toggleCustomizePanels" class="customize-btn">
          <span class="btn-layer" :class="{ active: !customizingPanels }">
            ⚙ {{ t("filters.header.customizePanels") }}
          </span>

          <span class="btn-layer" :class="{ active: customizingPanels }">
            ✔ {{ t("filters.header.saveOrder") }}
          </span>
        </button>

        <div class="filters-reset">
          <button class="btn-reset" @click="resetFilters">↺</button>
        </div>
      </div>

      <!-- 
      DRAGGABLE PANELS      

      Este componente permite reordenar los paneles de filtros mediante drag & drop.

      Se utiliza la librería VueDraggable (basada en SortableJS) para manejar
      la interacción de arrastrar y reordenar elementos.

      CONFIGURACIÓN PRINCIPAL

        - v-model="panels"
          Array reactivo que contiene los paneles y su orden actual.
          Cuando el usuario reordena los paneles, este array se actualiza automáticamente.

        - item-key="id"
          Identificador único de cada panel.
          Vue lo usa para rastrear correctamente los cambios en el DOM.

        - class="filters-panels"
          Clase contenedora donde viven todos los paneles.

      CONTROL DE MODO PERSONALIZACIÓN

        - :disabled="!customizingPanels"
          Desactiva completamente el drag & drop cuando el modo
          "personalizar paneles" está apagado.

        - :class="{ 'customize-mode': customizingPanels }"
          Agrega una clase visual cuando el usuario entra en modo personalización
          (por ejemplo para mostrar iconos de drag o cambiar estilos).

      CLASES DURANTE EL DRAG

        - ghost-class="drag-ghost"
          Clase aplicada al placeholder que queda mientras arrastrás el panel.

        - chosen-class="drag-chosen"
          Clase aplicada al panel seleccionado al iniciar el drag.

        - drag-class="drag-active"
          Clase aplicada al panel mientras se está arrastrando.

      ANIMACIÓN

        - animation="200"
          Duración en milisegundos de la animación cuando los paneles
          cambian de posición.
      -->
      <draggable
        v-model="panels"
        item-key="id"
        class="filters-panels"
        :disabled="!customizingPanels"
        :class="{ 'customize-mode': customizingPanels }"
        ghost-class="drag-ghost"
        chosen-class="drag-chosen"
        drag-class="drag-active"
        animation="200"
      >
        <!--
        SLOT "item" DE DRAGGABLE

        draggable usa un slot llamado "item" para renderizar cada elemento del array.

        - { element }
        Es el objeto actual del array `panels` que se está renderizando.

        En este caso `element` tiene esta estructura:
        {
          id: "filters" | "genres" | "sort",
          title: string
        }

        Por lo tanto dentro de este template estamos dibujando
        cada panel del sidebar usando los datos del array.
        -->

        <template #item="{ element }">
          <div
            class="panel"
            :class="{
              disabled:
                !filtersEnabled && element !== 'list' && !customizingPanels,
            }"
            @mouseenter="handlePanelMouseEnter"
            @mousemove="handlePanelMouseMove"
            @mouseleave="resetPanelTilt"
          >
            <div class="panel-tilt">
              <div
                class="panel-header"
                @click="
                  !customizingPanels &&
                  (filtersEnabled || element === 'list') &&
                  togglePanel(element)
                "
              >
                <div class="panel-title">
                  <span
                    class="drag-handle"
                    :class="{ show: customizingPanels }"
                  >
                    ⋮⋮
                  </span>

                  <span>{{ panelTitles[element as PanelId] }}</span>
                </div>

                <span
                  class="arrow"
                  :class="{ open: openPanels[element as PanelId] }"
                >
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M9 6l6 6-6 6"
                      stroke="currentColor"
                      stroke-width="2"
                      fill="none"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
              </div>

              <Transition name="panel">
                <div v-show="openPanels[element as PanelId]" class="panel-body">
                  <!-- LISTA DE TIPOS -->

                  <template v-if="element === 'list'">
                    <div class="panel-divider"></div>

                    <Multiselect
                      class="multiselect"
                      :model-value="listTypesOptions.find((o) => o.value === listType)"
                      :options="listTypesOptions"
                      label="label"
                      track-by="value"
                      :searchable="false"
                      :append-to-body="true"
                      @select="(o: ListTypeOption) => (listType = o.value)"
                      @clear="listType = 'discover'"
                      selectLabel=""
                      deselectLabel=""
                      selectedLabel=""
                      @open="onSelectOpen(element)"
                      @close="onSelectClose(element)"
                    />
                  </template>

                  <!-- FILTROS -->

                  <template v-if="element === 'filters'">
                    <div class="panel-divider"></div>

                    <input
                      v-model="txtMovie"
                      type="text"
                      :placeholder="t('filters.searchPlaceholder')"
                      class="filter-input search-input"
                    />

                    <div class="panel-divider"></div>

                    <div class="filter-block">
                      <label class="filter-label">
                        {{ t("filters.years") }}

                        <span class="filter-value">
                          {{ sliderYears[0] }} – {{ sliderYears[1] }}
                        </span>
                      </label>

                      <VueSlider
                        ref="yearSlider"
                        v-model="sliderYears"
                        :min="1900"
                        :max="new Date().getFullYear()"
                        :interval="1"
                        :marks="decadeMarks"
                        @drag-end="applyYearFilter"
                      />
                    </div>

                    <div class="panel-divider"></div>

                    <div class="filter-block">
                      <label class="filter-label">
                        {{ t("filters.rating") }}

                        <span class="filter-value">
                          {{ ratingRange[0] }} – {{ ratingRange[1] }}
                        </span>
                      </label>

                      <VueSlider
                        v-model="sliderRating"
                        :min="0"
                        :max="10"
                        :interval="0.5"
                        :marks="ratingMarks"
                        @drag-end="applyRatingFilter"
                      />
                    </div>
                  </template>

                  <!-- GENEROS -->

                  <template v-if="element === 'genres'">
                    <div class="panel-divider"></div>

                    <div class="genres">
                      <span
                        v-for="genre in genres"
                        :key="genre.id"
                        @click="movieFilters.toggleGenre(genre.id)"
                        :class="[
                          'genre-chip',
                          selectedGenres.includes(genre.id) ? 'active' : '',
                        ]"
                      >
                        {{ genre.name }}
                      </span>
                    </div>
                  </template>

                  <!-- LISTA PARA ORDENAR -->

                  <template v-if="element === 'sort'">
                    <div class="panel-divider"></div>

                    <Multiselect
                      class="multiselect"
                      :model-value="sortOptions.find((o) => o.value === sortBy)"
                      :options="sortOptions"
                      label="label"
                      track-by="value"
                      :searchable="false"
                      :append-to-body="true"
                      @select="(o: SortOption) => (sortBy = o.value)"
                      @clear="sortBy = null"
                      selectLabel=""
                      deselectLabel=""
                      selectedLabel=""
                      @open="handleOpen(element)"
                      @close="onSelectClose(element)"
                      :class="{ 'fake-disabled': isPanelDisabled(element) }"
                    />
                  </template>
                </div>
              </Transition>
            </div>
          </div>
        </template>
      </draggable>
    </div>

    <Transition name="scroll-btn">
      <button
        v-if="hasOverflow && canScrollDown"
              class="filters-scroll down"
              @mousedown="startScrollDown"
              @mouseup="stopScroll"
              @mouseleave="stopScroll"
        >
        ▼
      </button>
    </Transition>
  </div>
</template>

<style>
.filters {
  
  scroll-behavior: smooth;

  max-height: calc(100vh - 140px);
  overflow-y: auto;
  overflow-x: visible;

  /* ocultar scrollbar */
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  
  display: flex;
  flex-direction: column;
  gap: 18px;

  padding: 22px;

  /* Agregamos padding-bottom extra al contenedor scrollable
        para que el último panel pueda subir completamente. */
  padding-bottom: 80px;

  border-radius: 20px;

  background:
    radial-gradient(circle at 15% 10%, rgba(229, 9, 20, 0.12), transparent 45%),
    radial-gradient(
      circle at 80% 20%,
      rgba(124, 58, 237, 0.15),
      transparent 50%
    ),
    radial-gradient(
      circle at 40% 90%,
      rgba(30, 64, 175, 0.12),
      transparent 60%
    ),
    linear-gradient(180deg, rgba(15, 23, 42, 0.55), rgba(2, 6, 23, 0.65));

  backdrop-filter: blur(25px);

  border: 1px solid rgba(255, 255, 255, 0.06);

  box-shadow:
    0 35px 80px rgba(0, 0, 0, 0.75),
    0 0 60px rgba(124, 58, 237, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);

  /* animación muy lenta y sutil */
  animation: ambientShift 14s ease-in-out infinite;
}

@keyframes ambientShift {
  /* color normal */
  0% {
    filter: hue-rotate(0deg);
  }

  /* cambia levemente el tono */
  50% {
    filter: hue-rotate(20deg);
  }

  /* vuelve al original */
  100% {
    filter: hue-rotate(0deg);
  }
}

/* Chrome / Edge / Safari */
.filters::-webkit-scrollbar {
  display: none;
}

.filters::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;

  animation: ambientShift 14s ease-in-out infinite;
}

/* "Noise Glass”: se agrega una textura de ruido (grano) muy sutil encima de un
 fondo tipo glass / vidrio para que no se vea plano o artificial. */
.filters::before {
  /* Crea un pseudo-elemento antes del contenido del contenedor .filters */
  content: "";
  /* Posiciona esta capa de forma absoluta respecto al contenedor */
  position: absolute;
  /* Hace que la capa cubra todo el contenedor (top/right/bottom/left = 0) */
  inset: 0;
  /* Imagen de ruido/grano que se usa para darle textura al efecto glass */
  background-image: url("@/assets/noise.svg");
  /* Hace que el ruido sea muy sutil */
  opacity: 0.08;
  /* Mezcla el ruido con el fondo usando modo overlay
    para que no se vea como una imagen plana */
  mix-blend-mode: overlay;
  /* Evita que esta capa bloquee clicks o eventos del mouse */
  pointer-events: none;
  /* Hereda el mismo border-radius del contenedor para que coincidan las esquinas */
  border-radius: inherit;
}

/* Los button que son hijos directos de .filters. */
.filters > button {
  /* el boton se mueve mas a la izquierda */
  padding-right: 50px;
}

.filters-panels {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.customize-btn {
  position: relative;
  display: flex;
  align-items: center;
  height: 28px;
  cursor: pointer;
}

/* capas superpuestas */

.btn-layer {
  position: absolute;
  transition: all 0.25s ease;
  opacity: 0;
  transform: translateY(6px);
  white-space: nowrap;
}

.btn-layer.active {
  opacity: 1;
  transform: translateY(0);
}

.btn-reset {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);

  background: linear-gradient(
    135deg,
    rgba(124, 58, 237, 0.35),
    rgba(79, 70, 229, 0.35)
  );

  color: white;
  cursor: pointer;
  transition: all 0.2s ease;

  flex-shrink: 0;
}

.btn-reset:hover {
  /*transform:translateY(-1px);*/
  box-shadow: 0 0 12px rgba(124, 58, 237, 0.45);
}

/* ==================================================
/* PANELES 
/* ================================================== */

.panel {
  position: relative;
  z-index: 0;

  background: linear-gradient(
    180deg,
    rgba(30, 41, 59, 0.45),
    rgba(15, 23, 42, 0.55)
  );

  border-radius: 16px;

  border: 1px solid rgba(255, 255, 255, 0.05);

  box-shadow:
    0 15px 35px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);

  overflow: visible;

  /*transform-style:preserve-3d;*/
  /* necesario para firefox sino no se despliegan los paneles */
  transform-style: flat;

  transition:
    /* Anima suavemente cualquier cambio en la propiedad CSS "transform". */
    /* .15s  → duración de la animación (150 milisegundos) */
    /* ease  → curva de aceleración suave (empieza y termina lentamente) */
    /* Sin esta transición, el panel cambiaría de inclinación de forma
       instantánea y el movimiento se vería brusco cuando se moviera el mouse.
    */
    transform 0.15s ease,
    /*transform .25s cubic-bezier(.2,.8,.2,1),*/
    /* la sombra se anima suavemente. */ box-shadow 0.25s ease,
    /* Cuando cambia el borde en hover también se anima */ border-color 0.25s
      ease;
  /* Le avisa al navegador que la propiedad "transform" de este elemento
    va a cambiar frecuentemente (por ejemplo con rotateX / rotateY del
    efecto tilt). */
  /* El navegador entonces optimiza el renderizado: */
  /*  - puede preparar el elemento en la GPU
        - reduce micro-lag en animaciones
    - mejora la fluidez cuando el mouse se mueve rápido
    Importante: no conviene abusar de "will-change" en muchos elementos
    porque consume más memoria. */
  will-change: transform;

  /* Efecto de el panel parezca flotando en lugar de pegado al fondo. */
  /* lo hacemos con 3 capas de sombra + un highlight superior. */

  /* sombra profunda (profundidad real) */
  box-shadow:
    0 25px 60px rgba(0, 0, 0, 0.45),
    /* sombra media (transición suave) */ 0 10px 25px rgba(0, 0, 0, 0.25),
    /* borde de luz arriba (simula iluminación) */ inset 0 1px 0
      rgba(255, 255, 255, 0.08);
}

.panel-tilt {
  transform-style: preserve-3d;
  transition: transform 0.15s ease;
  will-change: transform;
}

/* pseudo-elemento que crea un glow dinámico dentro del panel
   se usa para simular una luz que aparece donde está el mouse */
.panel::after {
  /* necesario para que el pseudo-elemento exista */
  content: "";

  /* posiciona la capa encima del panel */
  position: absolute;

  /* hace que cubra todo el panel */
  inset: 0;

  /* fondo con un gradiente radial que genera el glow
    el centro del glow se mueve usando variables CSS --x y --y
    que normalmente se actualizan con JS cuando el mouse se mueve */
  background: radial-gradient(
    circle at var(--x) var(--y),
    rgba(124, 58, 237, 0.18),
    transparent 40%
  );

  /* el glow empieza invisible */
  opacity: 0;

  /* transición suave cuando aparece o desaparece */
  transition: opacity 0.3s;

  /* permite que el mouse siga interactuando con el panel */
  pointer-events: none;
}

.panel:has(.multiselect--active) {
  z-index: 100;
}

/* pseudo-elemento que crea una capa visual encima del panel
   se usa para simular iluminación y efectos glass */
.panel::before {
  /* crea la capa visual encima del panel */
  content: "";
  position: absolute;
  /* cubre todo el panel */
  inset: 0;
  /* respeta las esquinas redondeadas */
  border-radius: inherit;
  /* múltiples capas de luz */
  background:

    /* highlight fuerte arriba */
    /* luz violeta */
    linear-gradient(
      180deg,
      rgba(124, 58, 237, 0.35) 0%,
      rgba(124, 58, 237, 0.15) 15%,
      rgba(124, 58, 237, 0) 40%
    ),
    /* glow rojo cinematográfico */
    radial-gradient(circle at 20% -10%, rgba(229, 9, 20, 0.25), transparent 55%),
    /* glow violeta sutil */
    radial-gradient(circle at 80% 0%, rgba(124, 58, 237, 0.18), transparent 60%);

  /* mezcla la luz con el fondo */
  mix-blend-mode: overlay;
  /* evita bloquear clicks */
  pointer-events: none;
  /* un poco de suavizado */
  opacity: 0.9;
}

.panel:hover::after {
  opacity: 1;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transform: translateZ(18px);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.panel-body {
  /* reducir distancia linea divisoria 6px */
  padding: 6px 14px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow: visible;
  /* transform:translateZ(12px); */
  transform: none !important;
}

/* =====================================================
   Hover solo cuando el panel no está deshabilitado
   ===================================================== */   
/* Este efecto visual solo se aplica cuando el usuario pasa el mouse
   sobre un panel que está habilitado. */
   
.panel:not(.disabled):hover {
  /* Resalta el borde cuando el mouse pasa por encima */
  border-color: rgba(124, 58, 237, 0.45);

  /* Sombra exterior + glow violeta + pequeño brillo interno */
  box-shadow:
    0 25px 60px rgba(0, 0, 0, 0.75),          /* sombra principal profunda */
    0 0 35px rgba(124, 58, 237, 0.25),        /* glow violeta */
    inset 0 1px 0 rgba(255, 255, 255, 0.08);  /* brillo sutil interno */
}

/* =====================================================
   Estado deshabilitado del panel
   ===================================================== */
/* Cuando un panel tiene la clase ".disabled" significa que
   los filtros no están disponibles para el tipo de lista
   seleccionado (cuando no es "discover"). */

.panel.disabled {
  /* Baja la opacidad para indicar que no está activo */
  opacity: 0.45;
  /* Aplica escala de grises para reforzar el estado disabled */
  filter: grayscale(0.4);
  /* evita inclinación o animaciones */
  transform: none !important;
  /* evita transiciones visuales */
  transition: none;
}

/* =====================================================
   Desactivar glow del mouse cuando el panel está deshabilitado
   ===================================================== */
/*
   Los paneles tienen un pseudo-elemento "::after` que crea
   un glow dinámico basado en la posición del mouse.
   Cuando el panel está deshabilitado no debería reaccionar
   visualmente al cursor, por lo que forzamos la opacidad
   del glow a 0 para que no aparezca.
*/
.panel.disabled::after {
  opacity: 0 !important;
}

/* =====================================================
   Bloqueo de interacción dentro del panel deshabilitado
   ===================================================== */
/*
   Cuando el panel está en estado ".disabled", su contenido
   interno no debe permitir interacción.
*/
.panel.disabled .panel-body {

  /* desactiva cualquier evento del mouse dentro de ".panel-body" */
  pointer-events: none;
}

/* =====================================================
   Cursor "not allowed" cuando el panel está deshabilitado
   ===================================================== */
/* 
   Cuando el panel tiene la clase `.disabled`, el header
   ya no debe mostrar el cursor de interacción ("pointer").
   En su lugar usamos "not-allowed" para indicar visualmente
   que el elemento normalmente sería interactivo, pero en
   este momento está bloqueado o no disponible.
*/
.panel.disabled .panel-header {
  cursor: not-allowed;
}

.arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  transition: transform 0.25s ease;
  opacity: 0.8;
}

.arrow svg {
  width: 16px;
  height: 16px;
}

.arrow.open {
  transform: rotate(90deg);
}

/* ============================================================================
   ESTILOS DURANTE EL DRAG & DROP DE LOS PANELES
   ============================================================================ */

/* Se aplica al "ghost" del elemento:
   es el placeholder que queda en la lista mientras arrastrás el panel */
.drag-ghost {
  /* Reduce la opacidad para indicar que el elemento está siendo movido */
  opacity: 0.6;
  /* Lo hace levemente más chico para reforzar el efecto de elemento temporal */
  transform: scale(0.98);
  /* Aplica un pequeño blur para que se vea "fuera de foco"
       y el panel arrastrado destaque más */
  filter: blur(0.5px);
  /* Sombra grande y profunda para dar sensación de profundidad
       y separar visualmente el placeholder del resto */
  box-shadow:
    0 30px 70px rgba(0, 0, 0, 0.9),
    /* Glow violeta suave para mantener coherencia con el estilo del dashboard */
    0 0 40px rgba(124, 58, 237, 0.5);
}

/* Se aplica cuando el elemento acaba de ser seleccionado para arrastrar
   (cuando hacés click y empieza el drag) */

.drag-chosen {
  cursor: grabbing;
  /* Lo agranda levemente para dar sensación de "lift" o elevación */
  transform: scale(1.03);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
}

/* Se aplica al elemento que está siendo arrastrado activamente */
.drag-active {
  /* Cambia el cursor a "grabbing" para reforzar la interacción de arrastre */
  cursor: grabbing;
}

.filter-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 14px;
}

.filter-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 8px;
  /* espacio inferior */
  margin-bottom: 12px;
}

.filter-value {
  font-size: 12px;
  font-weight: 600;
  color: #e5e7eb;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(124, 58, 237, 0.12);
  border: 1px solid rgba(124, 58, 237, 0.35);

  box-shadow:
    inset 0 0 6px rgba(124, 58, 237, 0.25),
    0 0 6px rgba(124, 58, 237, 0.25);
}

/* ============================================================
   CAJA DE TEXTO
/* ============================================================ */

.filter-input {
  background: linear-gradient(
    135deg,
    rgba(2, 6, 23, 0.9),
    rgba(15, 23, 42, 0.9)
  );
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 10px;
  padding: 8px 10px;
  color: white;
  font-size: 13px;
  outline: none;
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.15s ease;
}

.search-input {
  padding-left: 32px;
  background-image: url("/src/assets/search.svg");
  background-repeat: no-repeat;
  background-position: 10px center;
}

/* placeholder */
.filter-input::placeholder {
  color: #64748b;
}

/* hover */
.filter-input:hover {
  border-color: rgba(124, 58, 237, 0.5);
}

/* focus */
.filter-input:focus {
  border-color: #7c3aed;
  box-shadow:
    0 0 0 1px rgba(124, 58, 237, 0.6),
    0 0 18px rgba(124, 58, 237, 0.35);
  transform: translateY(-1px);
}

/* ============================================================
   SLIDER DE FECHAS
/* ============================================================ */

/* 
  Línea vertical que representa cada marca (tick) del slider.
  Es el pequeño indicador que aparece sobre el rail.
*/
.vue-slider-mark-step {
  width: 2px;
  /* Grosor de la línea de la marca */
  height: 18px;
  /* Altura total de la marca. La línea se reparte mitad arriba y mitad abajo del rail */
  background: rgba(255, 255, 255, 0.25);
  /* Color base de las marcas (gris tenue para UI oscura) */
  position: absolute;
  /* Permite posicionar la línea respecto al contenedor */
  top: 50%;
  /* Coloca el centro de la línea en el centro del rail */
  transform: translateY(-50%);
  /* Corrige la posición para centrarla perfectamente */
}

/* 
  Marcas que quedan dentro del rango seleccionado del slider.
  Vue Slider agrega automáticamente la clase `.vue-slider-mark-active`
  cuando una marca está entre los dos handles.
*/
.vue-slider-mark-active .vue-slider-mark-step {
  background: #7c3aed;
  /* Color violeta para indicar que está dentro del rango */
}

/* 
  Texto opcional que puede aparecer debajo de la marca
  (por ejemplo el año: 1900, 1950, 2000, etc.)
*/
.vue-slider-mark-label {
  font-size: 10px;
  /* Tamaño pequeño para no saturar el slider */
  color: #9ca3af;
  /* Gris suave para mantener buena legibilidad */
  margin-top: 6px;
  /* Separación entre el rail del slider y el texto */
}

/* ============================================================
   TOOLTIP DEL HANDLE DEL SLIDER
   ============================================================ */

/*
  `.vue-slider-dot-tooltip-inner` es el contenedor interno
  del tooltip que aparece encima del handle cuando el usuario
  mueve el slider.

  Este tooltip muestra el valor actual (por ejemplo el año
  o el rating seleccionado).
*/
.vue-slider-dot-tooltip-inner {
  /* Fondo con gradiente diagonal (135°)
     violeta → índigo para mantener coherencia con el estilo
     visual del panel y del slider */
  background: linear-gradient(
    135deg,
    rgba(124, 58, 237, 0.9),
    /* violeta principal */ rgba(79, 70, 229, 0.9) /* transición índigo */
  ) !important;

  /* Color del texto del valor mostrado en el tooltip */
  color: white;

  /* Borde sutil para separar el tooltip del fondo */
  border: 1px solid rgba(255, 255, 255, 0.15);

  /* Efecto glass / vidrio desenfocado detrás del tooltip */
  backdrop-filter: blur(10px);

  /* Sombra exterior para generar profundidad y glow */
  box-shadow:

    /* sombra principal debajo del tooltip */
    0 4px 15px rgba(124, 58, 237, 0.45),
    /* glow violeta suave alrededor */ 0 0 8px rgba(124, 58, 237, 0.25);
}

/* ============================================================
   FLECHA DEL TOOLTIP
   ============================================================ */

/*
  El tooltip tiene una pequeña flecha triangular que apunta
  hacia el handle del slider.

  Este pseudo-elemento controla el color de esa flecha.
*/
.vue-slider-dot-tooltip-inner::after {
  /* Color del triángulo superior que conecta el tooltip
     con el handle del slider.

     Se usa !important porque el componente define
     este color por defecto en su propio CSS. */
  border-top-color: rgba(124, 58, 237, 0.9) !important;
}

/* ============================================================
   EFECTO VISUAL DEL RANGO SELECCIONADO DEL SLIDER
   ============================================================ */

/* 
  `.vue-slider-process` es la barra que representa el rango activo
  entre los dos handles del slider.

  Es decir:
  desde el valor mínimo seleccionado
  hasta el valor máximo seleccionado.
*/
.vue-slider-process {
  /* Gradiente horizontal que da un efecto más rico que un color plano.
     Va de violeta → índigo → azul, lo que encaja con tu estética
     cinematográfica y con el glow violeta del panel. */
  background: linear-gradient(
    90deg,
    #7c3aed,
    /* violeta principal */ #4f46e5,
    /* transición índigo */ #2563eb /* azul profundo al final */
  );

  /* Glow luminoso alrededor del rango activo.
     Esto hace que el rango seleccionado "brille"
     y destaque sobre el rail oscuro. */
  box-shadow:

    /* Glow cercano más intenso */
    0 0 15px rgba(124, 58, 237, 0.6),
    /* Glow más amplio y suave para dar profundidad */ 0 0 35px
      rgba(124, 58, 237, 0.35);
}

/* ============================================================
   CONTENEDOR DEL SLIDER
   ============================================================ */

/* 
  Se define `position: relative` para que los pseudo-elementos
  (como ::after) puedan posicionarse correctamente dentro del slider.
*/
.vue-slider {
  position: relative;
}

/* ============================================================
   GLOW AMBIENTAL DEL SLIDER
   ============================================================ */

/*
  Este pseudo-elemento crea una iluminación ambiental
  alrededor del slider.

  No representa el rango seleccionado directamente,
  sino un halo de luz suave que refuerza el estilo
  glass / neon / cinematográfico del panel.
*/
.vue-slider::after {
  /* necesario para que el pseudo-elemento exista */
  content: "";

  /* posiciona la capa encima del slider */
  position: absolute;

  /* hace que cubra todo el área del slider */
  inset: 0;

  /* gradiente radial centrado que genera el halo de luz */
  background: radial-gradient(
    /* forma circular del glow */ circle at 50% 50%,

    /* violeta translúcido en el centro */ rgba(124, 58, 237, 0.15),
    /* se desvanece gradualmente hacia transparente */ transparent 60%
  );

  /* reduce la intensidad para que el efecto sea sutil */
  opacity: 0.4;

  /* evita que esta capa bloquee eventos del mouse
     (drag del slider, hover, etc.) */
  pointer-events: none;
}

/* ============================================================
   ESTILO DE SLIDERS DE FECHAS Y RATING
/* ============================================================ */

.vue-slider-rail {
  height: 6px;

  background: linear-gradient(90deg, #020617, #1e293b);

  border-radius: 999px;
}

.vue-slider-process {
  background: linear-gradient(90deg, #7c3aed, #4f46e5, #2563eb);

  box-shadow: 0 0 12px rgba(124, 58, 237, 0.6);
}

.vue-slider-dot-handle {
  width: 16px;
  height: 16px;

  background: radial-gradient(circle, #ffffff, #7c3aed);

  border: none;

  box-shadow:
    0 0 14px rgba(124, 58, 237, 0.8),
    0 0 25px rgba(124, 58, 237, 0.4);
}

.vue-slider-dot-handle:hover {
  transform: scale(1.2);
  box-shadow:
    0 0 20px rgba(124, 58, 237, 1),
    0 0 40px rgba(124, 58, 237, 0.7);
}

/* ============================================================
   GENEROS
/* ============================================================ */

.genres {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.genre-chip {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;

  background: linear-gradient(
    135deg,
    rgba(88, 28, 135, 0.55),
    rgba(49, 46, 129, 0.75)
  );

  border: 1px solid rgba(124, 58, 237, 0.45);
  color: #e9d5ff;
  cursor: pointer;
  transition: all 0.25s ease;
}

.genre-chip:hover {
  transform: translateY(-1px);
  border-color: #7c3aed;
  box-shadow: 0 0 14px rgba(124, 58, 237, 0.45);
}

.genre-chip.active {
  background: linear-gradient(135deg, #7c3aed, #4f46e5);

  color: white;

  box-shadow: 0 0 18px rgba(124, 58, 237, 0.8);
}

/* ============================================================
   COMBOS 
/* ============================================================ */

.multiselect {
  font-size: 13px;
  width: 100%;
}

.multiselect__tags {
  background: linear-gradient(
    135deg,
    rgba(2, 6, 23, 0.9),
    rgba(15, 23, 42, 0.9)
  );
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 10px;
  padding: 8px 34px 8px 10px;
  color: white;
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.15s ease;
}

.multiselect:hover .multiselect__tags {
  border-color: #7c3aed;
}

.multiselect--active .multiselect__tags {
  border-color: #7c3aed;
  box-shadow:
    0 0 0 1px rgba(124, 58, 237, 0.6),
    0 0 18px rgba(124, 58, 237, 0.35);
}

/* texto del combo */
.multiselect__single {
  /* Desplaza ligeramente el texto hacia abajo dentro del combo.
   Esto corrige un pequeño desalineado visual que aparece
   cuando se modifica el padding del componente (.multiselect__tags),
   haciendo que el texto quede visualmente centrado.
*/
  transform: translateY(2px);
}

/* 
   Flecha del componente de multiselect.

    - height: 100%
     Hace que el área clickeable de la flecha ocupe toda la altura
     del input (.multiselect__tags). Esto mejora la usabilidad porque
     permite abrir/cerrar el dropdown clickeando en cualquier parte
     vertical de la zona derecha del combo.

   - z-index: 10
     Eleva la flecha por encima de otros elementos internos del componente
     (especialmente .multiselect__tags), que pueden superponerse cuando
     el dropdown está abierto.
*/

.multiselect__select {
  height: 100%;
  z-index: 10;
}

.multiselect__select::before {
  border-color: #7c3aed transparent transparent;
  top: 50%;
}

/* dropdown */
.multiselect__content-wrapper {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;

  z-index: 99999 !important;

  background: linear-gradient(
    180deg,
    rgba(15, 23, 42, 0.95),
    rgba(2, 6, 23, 0.95)
  );

  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 10px;
  margin-top: 6px;
  backdrop-filter: blur(12px);
  box-shadow:
    0 15px 40px rgba(0, 0, 0, 0.75),
    0 0 25px rgba(124, 58, 237, 0.25);
}

/* opciones */
.multiselect__option {
  color: #e5e7eb;
  padding: 10px 12px;
  transition: transform 0.15s ease;
}

/* hover opción */

.multiselect__option--highlight {
  background: linear-gradient(135deg, #7c3aed, #4f46e5) !important;

  color: white !important;
}

/* opción seleccionada */
.multiselect__option--selected {
  background: linear-gradient(135deg, #7c3aed, #4f46e5) !important;

  color: white !important;
}

/* eliminar borde blanco raro */
.multiselect__input,
.multiselect__single {
  background: transparent;
}

/* ============================================================
   FORZAR APERTURA DEL MULTISELECT HACIA ABAJO
   ============================================================ */

/*
   vue-multiselect detecta automáticamente si no hay suficiente
   espacio debajo del input y en ese caso agrega la clase:

   .multiselect--above

   Esto hace que el dropdown se abra hacia arriba.
   En el layout (sidebar con paneles 3D) eso genera
   problemas visuales porque el menú puede superponerse
   con otros paneles.
*/

/*
   Esta regla anula ese comportamiento y fuerza que el
   dropdown siempre se renderice debajo del input,
   incluso si la librería intenta abrirlo hacia arriba.
*/
.multiselect--above .multiselect__content-wrapper {
  /* Cancelamos el posicionamiento inferior */
  bottom: auto !important;

  /* Forzamos el dropdown a posicionarse debajo del input */
  top: 100% !important;

  /* Pequeño espacio entre el input y el menú desplegable */
  margin-top: 4px;
}

.fake-disabled {
  opacity: 0.45;
  filter: grayscale(0.4);
  pointer-events: none;
  cursor: not-allowed;
}

/* ============================================================
   BOTON DE RESETEO
/* ============================================================ */

.filters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.panel-leave-active {
  position: relative;
}

.panel-enter-active,
.panel-leave-active {
  transition:
    max-height 0.3s ease,
    opacity 0.2s ease;
  overflow: hidden;
}

.panel-enter-from,
.panel-leave-to {
  max-height: 0;
  opacity: 0;
}

.panel-enter-to,
.panel-leave-from {
  max-height: 500px;
  opacity: 1;
}

.drag-handle {
  opacity: 0.8;
  margin-right: 4px;
  font-size: 14px;
  opacity: 0;
  transform: translateX(-4px);
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
  cursor: grab;
}

.drag-handle.show {
  opacity: 0.6;
  transform: translateX(0);
}

.customize-mode .panel-header {
  cursor: grab;
}

.customize-mode .panel {
  cursor: grab;
  border-color: rgba(124, 58, 237, 0.35);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.8),
    0 0 25px rgba(124, 58, 237, 0.35);
  animation: panelEditPulse 3s ease-in-out infinite;
}

@keyframes panelEditPulse {
  0% {
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.8),
      0 0 15px rgba(124, 58, 237, 0.2);
  }

  50% {
    box-shadow:
      0 25px 65px rgba(0, 0, 0, 0.9),
      0 0 35px rgba(124, 58, 237, 0.4);
  }

  100% {
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.8),
      0 0 15px rgba(124, 58, 237, 0.2);
  }
}

.sortable-drag {
  transform: none !important;
}

/* ==========================================================================
   BOTONES DE SCROLL DEL PANEL DE FILTROS
   ==========================================================================

   Estos botones permiten desplazarse manualmente dentro del contenedor
   de filtros cuando existe overflow vertical.

   ▲  botón superior  → scroll hacia arriba
   ▼  botón inferior  → scroll hacia abajo

   Se posicionan flotando en el borde derecho del panel.
*/

.filters-scroll {
  /* Posicionamiento flotante respecto al contenedor */
  position: absolute;
  right: -14px;
  /* sobresale ligeramente del borde del panel */

  /* Tamaño del botón */
  width: 28px;
  height: 28px;

  border-radius: 8px;

  /* Color base del icono */
  color: #a78bfa;
  /* violeta suave */

  /* ------------------------------------------------------------------
       EFECTO GLASS / VIDRIO
       ------------------------------------------------------------------ */

  background: rgba(15, 23, 42, 0.35);
  /* fondo oscuro semi-transparente */
  backdrop-filter: blur(14px);
  /* efecto glass */

  border: 1px solid rgba(255, 255, 255, 0.08);

  /* ------------------------------------------------------------------
       SOMBRA Y PROFUNDIDAD
       ------------------------------------------------------------------ */

  box-shadow:
    0 8px 25px rgba(0, 0, 0, 0.55),
    /* sombra exterior */ inset 0 1px 0 rgba(255, 255, 255, 0.06);
  /* highlight interno */

  /* Animaciones suaves */
  /* transition:
        transform .15s ease,
        box-shadow .25s ease,
        border-color .25s ease; */

  /* transición suave */
  transition:
    opacity 0.35s ease,
    transform 0.15s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;

  opacity: 1;

  /* Centrado del icono dentro del botón */
  display: flex;
  align-items: center;
  justify-content: center;

  cursor: pointer;

  /* Z-index para asegurar que quede sobre los paneles */
  z-index: 10;
}

.filters-scroll[style*="display: none"] {
  opacity: 0;
}

/* ==========================================================================
   EFECTO HOVER DEL BOTÓN
   ========================================================================== */

.filters-scroll:hover {
  /* color más brillante al pasar el mouse */
  color: #c4b5fd;

  /* borde violeta más visible */
  border-color: rgba(124, 58, 237, 0.6);

  /* glow violeta + sombra más fuerte */
  box-shadow:
    0 10px 35px rgba(0, 0, 0, 0.75),
    0 0 18px rgba(124, 58, 237, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

/* ==========================================================================
   POSICIONAMIENTO DE BOTONES
   ========================================================================== */

/* botón superior (▲) */
.filters-scroll.up {
  top: 40%;
}

/* botón inferior (▼) */
.filters-scroll.down {
  top: 55%;
}

/* ==========================================================================
   ANIMACIÓN DE APARICIÓN / DESAPARICIÓN DE BOTONES DE SCROLL
   ==========================================================================

   Vue aplica automáticamente estas clases cuando el elemento entra
   o sale del DOM dentro de <Transition>.

   Esto permite animar el botón antes de que sea eliminado.
*/

/* transición activa durante entrada y salida */
.scroll-btn-enter-active,
.scroll-btn-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

/* estado inicial cuando el botón aparece */
.scroll-btn-enter-from {
  opacity: 0;
  transform: translateY(6px);
  /* leve desplazamiento */
}

/* estado final cuando el botón desaparece */
.scroll-btn-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* estado visible normal */
.scroll-btn-enter-to,
.scroll-btn-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* ==========================================================================
   DIVISOR VISUAL ENTRE SECCIONES DE PANEL
   ========================================================================== */

.panel-divider {
  position: relative;

  /* altura de la línea */
  height: 1px;

  /* margen vertical */
  margin: 0px 0;

  /* línea degradada con tonos violeta / azul */
  background: linear-gradient(
    90deg,
    transparent,
    rgba(124, 58, 237, 0.45),
    rgba(79, 70, 229, 0.55),
    rgba(124, 58, 237, 0.45),
    transparent
  );
}

/* ==========================================================================
   GLOW DEL DIVISOR
   ==========================================================================

   Pseudo-elemento que crea un brillo suave alrededor de la línea
   para darle un aspecto más cinematográfico / neon.
*/

.panel-divider::after {
  content: "";

  position: absolute;

  /* expande ligeramente el área del glow */
  inset: -2px 0;

  background: linear-gradient(
    90deg,
    transparent,
    rgba(124, 58, 237, 0.25),
    rgba(79, 70, 229, 0.25),
    transparent
  );

  /* suaviza el brillo */
  filter: blur(6px);

  opacity: 0.7;
}
</style>