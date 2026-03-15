/*
 * Composable responsable de manejar toda la lógica de filtros de películas.
 *
 * Responsabilidad:
 * - Gestionar el estado reactivo de los filtros de búsqueda.
 * - Aplicar debounce al texto de búsqueda.
 * - Determinar si hay texto válido o filtros activos.
 * - Generar la queryKey utilizada por Vue Query para cache y refetch.
 *
 * También expone variables reactivas derivadas como:
 *   hasText, hasFilters y queryKey.
 *
 * Devuelve un objeto tipado "MovieFilters" para que los componentes
 * que lo utilicen tengan autocompletado y validación de tipos en TypeScript.
 */

import { reactive, computed, watch, toRefs } from "vue";

import type { MovieListType } from "@/types/movie-list-type";

import { useRoute } from "vue-router";

export function useMoviesFilters() {

  const route = useRoute();

  // Estado reactivo que contiene TODOS los filtros de películas.
  // Se usa reactive agrupado para evitar tener muchos ref() separados y así
  // poder acceder directamente en templates sin usar `.value`.
  const filters = reactive({
    // tipo de listado seleccionado
    listType: "discover" as MovieListType,
    // Texto que escribe el usuario en la búsqueda
    txtMovie: typeof route.query.search === "string" ? route.query.search : "",
    // Texto con debounce usado para ejecutar la query a la API
    debouncedQuery: "",
    // Lista de IDs de géneros seleccionados
    selectedGenres: [] as number[],
    // Año mínimo de estreno
    yearFrom: null as number | null,
    // Año máximo de estreno
    yearTo: null as number | null,
    // Rango de rating seleccionado en el slider [min, max]
    ratingRange: [0, 10] as [number, number],
    // Orden seleccionado para la API de TMDB
    sortBy: null as string | null,
  });

/* --------------------------------------------------------------------------------------- */

watch(
() => route.query.search, // Observa la query "search" de la URL
  (value, oldValue) => {

    // Nos aseguramos de que sea string y removemos espacios al inicio y fin
    const query = typeof value === "string" ? value.trim() : ""

    // Si hay texto nuevo y distinto al anterior, reseteamos los filtros
    if (query && query !== oldValue) {
      resetFiltersForSearch()
    }

    // Actualizamos el filtro de texto principal
    filters.txtMovie = query

    // IMPORTANTE: disparar búsqueda inmediatamente si hay al menos 3 caracteres
    // Esto actualiza directamente debouncedQuery para que Vue Query pueda reaccionar
    if (query.length >= 3) {
      filters.debouncedQuery = query
    } else {
      // Si hay menos de 3 caracteres, no ejecutamos búsqueda
      filters.debouncedQuery = ""
    }
  }
)

function resetFiltersForSearch() {
  // Resetea el tipo de listado al valor por defecto "discover"
  // Esto asegura que la búsqueda vuelva a usar el endpoint principal
  filters.listType = "discover"

  // Limpia todos los géneros seleccionados
  // Garantiza que la búsqueda no filtre por géneros previos
  filters.selectedGenres = []

  // Reinicia el año mínimo a null (sin restricción)
  filters.yearFrom = null

  // Reinicia el año máximo a null (sin restricción)
  filters.yearTo = null

  // Restablece el rango de rating al máximo rango posible [0, 10]
  // Esto evita filtrar por rating de búsquedas anteriores
  filters.ratingRange = [0, 10]

  // Establece el orden de búsqueda por defecto a "vote_average.desc"
  // Esto normalmente significa "mayor rating primero"
  filters.sortBy = "vote_average.desc"
}

/* --------------------------------------------------------------------------------------- */

  // Toggle género
  const toggleGenre = (id: number) => {
    const index = filters.selectedGenres.indexOf(id);

    if (index !== -1) {
      // Se elimina el genero de generos seleccionados
      filters.selectedGenres.splice(index, 1);
    } else {
      // Se agrega el genero a generos seleccionados
      filters.selectedGenres.push(id);
    }
  };

  // guardamos el timeout fuera del watch
  let timeout: number | undefined;

  // DEBOUNCE - la funcion para buscar la pelicula solo se ejecuta despues de un tiempo
  // Se vigila la caja de texto Movie
  watch(
    () => filters.txtMovie,
    (value) => {
      // Se resetea el timeout
      clearTimeout(timeout);

      // window.setTimeout evita problemas de tipos en TS.
      // Si pasan los 500 ms entonces se pasa el valor de txtMovie a debounceQuery
      // para poder ejecutar la funcion para buscar la pelicula
      timeout = window.setTimeout(() => {

        const clean = value.trim()

        // validación de 3 caracteres
        if (clean.length >= 3) {
          filters.debouncedQuery = clean
        } else {
          filters.debouncedQuery = ""        
        }

      }, 500);
    },
  );

  // Indica si el texto de búsqueda es válido.
  // Se usa trim() para ignorar espacios y se exige mínimo 3 caracteres
  const hasText = computed(() => filters.debouncedQuery.trim().length >= 3);

  // Indica si hay algún filtro activo.
  // Se usa para saber si hay que ejecutar la búsqueda con filtros
  const hasFilters = computed(
    () =>
      filters.listType === "discover" &&
      (filters.selectedGenres.length > 0 || // hay géneros seleccionados
        filters.yearFrom !== null || // hay año mínimo
        filters.yearTo !== null || // hay año máximo
        filters.sortBy !== null || // hay orden seleccionado
        filters.ratingRange[0] > 0 || // rating mínimo cambiado
        filters.ratingRange[1] < 10), // rating máximo cambiado
  );

  // Valores derivados del slider de rating.
  // Se separan para usar el valor min y max
  const minRating = computed(() => filters.ratingRange[0]);
  const maxRating = computed(() => filters.ratingRange[1]);

  const sortedGenres = computed(() =>
    [...filters.selectedGenres].sort((a, b) => a - b),
  );

  /*
    queryKey: clave única para Vue Query.
    Si cambia, Vue Query:

    - Busca cache
    - Si no existe → ejecuta la query
    - Si existe → devuelve cache

    Incluye todo lo que afecte los resultados (texto, géneros, años, rating, orden).
    Ejemplo: ['movies', 'batman', [28], 'es']
    */
  const queryKey = computed(() => [
    "movies",
    filters.listType,
    filters.debouncedQuery || null,
    sortedGenres.value,
    filters.yearFrom,
    filters.yearTo,
    minRating.value,
    maxRating.value,
    filters.sortBy,
  ]);

  return {
    // Convierte cada propiedad del objeto reactive `filters` en un Ref independiente.
    // Así, cuando el composable devuelve el objeto, cada propiedad mantiene la reactividad
    // en los componentes que lo usen.
    ...toRefs(filters),
    toggleGenre,
    hasText,
    hasFilters,
    queryKey,
    minRating,
    maxRating,
  };
}

/* Se usa ReturnType para que TypeScript infiera automáticamente los tipos de datos */
/*
TypeScript ahora deduce todo solo:
    txtMovie → Ref<string>
    selectedGenres → Ref<number[]>
    hasFilters → ComputedRef<boolean>...
*/
export type MovieFilters = ReturnType<typeof useMoviesFilters>;
