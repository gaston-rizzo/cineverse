/**
 * Composable que gestiona la búsqueda de películas usando Vue Query.
 *
 * Responsabilidad:
 * Ejecutar la query correcta según el estado actual de los filtros.
 *
 * Este composable decide automáticamente qué endpoint usar:
       
 * 0) Listados predefinidos. Si es distinto a discover
 *    → getMovieList()
 * 
 * 1) Texto solamente
 *    → searchByText()
 *
 * 2) Filtros solamente
 *    → searchByFilters()
 *
 * 3) Texto + filtros
 *    → searchByTextAndFilters()
 *
 * Uso:
 * const { data, isLoading, error } = useMoviesQuery(filters, apiLanguage)
 *
 * data contiene:
 * {
 *   page: number
 *   results: Movie[]
 *   total_pages: number
 *   total_results: number
 * }
 */

import { computed } from "vue";
import type { Ref } from "vue";

import { useInfiniteQuery } from "@tanstack/vue-query";

import type { PaginatedResponse } from "@/shared/types/paginated-response";
import type { Movie } from "@/features/movies/types/movie";

import { getMovieList } from "@/features/movies/services/movies.service";
import type { MovieListType } from "@/features/movies/types/movie-list-type";

import {
  searchByText,
  searchByFilters,
  searchByTextAndFilters,
} from "@/features/movies/services/movies.service";

import { useMoviesFilters } from "./useMoviesFilters";

export type MovieFilters = ReturnType<typeof useMoviesFilters>;

export function useMoviesQuery(filters: MovieFilters, language: Ref<string>) {

  /* ==========================================================================
   HOOK PRINCIPAL: useInfiniteQuery
   --------------------------------------------------------------------------
   Gestiona la búsqueda de películas con paginación infinita.
   Vue Query se encarga de:
   - almacenar en caché los resultados de cada página
   - gestionar la recarga automática si cambian los filtros o idioma
   - permitir cargar la siguiente página con getNextPageParam
   La data que devuelve useQuery tiene la forma de PaginatedResponse<Movie> 
   es decir, useQuery va a devolver datos de tipo PaginatedResponse<Movie>. 
   ========================================================================== */

  return useInfiniteQuery<PaginatedResponse<Movie>>({

    /**
     * queryKey define la identidad de la query en Vue Query.    
     * Si cualquiera de estos valores cambia,
     * Vue Query vuelve a ejecutar automáticamente la query.
     */
    queryKey: computed(() => [
      // Query base generada por el composable de filtros
      ...filters.queryKey.value,
      // El idioma forma parte de la query
      // porque la API devuelve resultados distintos según el language
      language.value,      
    ]),

    // Página inicial al cargar la query
    initialPageParam: 1,
    // Tiempo (ms) que los datos se consideran “fresh” antes de estar “stale”.
    // Con 0 → los datos se consideran inmediatamente obsoletos, 
    // por lo que Vue Query podrá refetchear según las reglas de enabled/refetchOnMount.
    staleTime: 0, 
    // Garbage Collection Time (ms) antes de eliminar la caché de la query.
    // Con 0 → la caché se limpia inmediatamente si la query se desconecta.
    gcTime: 0,   
    // Indica si la query se debe refetchear cuando el componente que la usa se monta.
    // true → siempre intenta actualizar al montar, útil para resultados dinámicos.
    refetchOnMount: true, 
    // Indica si la query se refetchea automáticamente cuando la ventana del navegador recupera el foco.
    // false → no hacemos refetch al cambiar de pestaña, útil para no sobrecargar la API.
    refetchOnWindowFocus: false, 

    /**
     * enabled controla cuándo la query puede ejecutarse.
     */
    enabled: computed(
      () =>
        // La query debe ejecutarse cuando:
        //  - el usuario selecciona una lista distinta de "discover"
        //  - hay texto de búsqueda
        //  - hay filtros activos
        //  - o simplemente cuando estamos en "discover" como ocurre cuando iniciamos la pagina
        // Nota: esta condición actualmente siempre evalúa true, por lo que la query nunca queda deshabilitada.
        filters.listType.value !== "discover" ||
        filters.hasText.value ||
        filters.hasFilters.value ||
        filters.listType.value === "discover",
    ),

    /**
     * queryFn es la función que ejecuta la llamada a la API.
     *
     * Siempre debe devolver:
     * Promise<PaginatedResponse<Movie>>
     */
    queryFn: ({ pageParam = 1 }) => {
      
      // pageParam es la página que maneja Vue Query internamente.
      const page = pageParam as number;

      /**
       * Normalizamos las opciones de filtros para evitar
       * repetir el mismo objeto en múltiples llamadas.
       */
      const filterOptions = {
        genres: filters.selectedGenres.value,
        // Si no existe valor se envía undefined
        // para que la API ignore el filtro
        yearFrom: filters.yearFrom.value ?? undefined,
        yearTo: filters.yearTo.value ?? undefined,
        minRating: filters.minRating.value,
        maxRating: filters.maxRating.value,
        sortBy: filters.sortBy.value ?? "release_date.desc",
        // sortBy: filters.sortBy.value ?? undefined
      };

      /**
       * Caso 0
       * Listados predefinidos
       */
      if (filters.listType.value !== "discover") {
        return getMovieList(
          filters.listType.value as MovieListType,
          page,
          language.value,
        );
      }

      /**
       * Caso 1
       * Texto + filtros
       */
      if (filters.hasText.value && filters.hasFilters.value) {
        return searchByTextAndFilters(page, language.value, {
          query: filters.debouncedQuery.value,
          // crea un objeto con query y después agrega todas las propiedades que tenga filterOptions
          ...filterOptions,
        });
      }

      /**
       * Caso 2
       * Solo texto
       */
      if (filters.hasText.value) {
        return searchByText(filters.debouncedQuery.value, page, language.value);
      }

      /**
       * Caso 3
       * Solo filtros
       */
      return searchByFilters(page, language.value, filterOptions);
    },

    /**
    * getNextPageParam: determina qué página traer a continuación
    * Si la página actual < total_pages → devuelve siguiente página
    * Si ya es la última página → devuelve undefined
    */
    getNextPageParam: (lastPage) => {

      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1;
      }

      return undefined;
    },
  });
}
