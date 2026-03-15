/**
 * Composable que gestiona la búsqueda de películas usando Vue Query.
 *
 * Responsabilidad:
 * Ejecutar la query correcta según el estado actual de los filtros.
 *
 * Este composable decide automáticamente qué endpoint usar:
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
import { useQuery } from "@tanstack/vue-query";

import type { PaginatedResponse } from "@/types/paginated-response";
import type { Movie } from "@/types/movie";

import { getMovieList } from "@/api/movies/movies.service";
import type { MovieListType } from "@/types/movie-list-type";

import {
  searchByText,
  searchByFilters,
  searchByTextAndFilters,
} from "@/api/movies/movies.service";

import { useMoviesFilters } from "./useMoviesFilters";

export type MovieFilters = ReturnType<typeof useMoviesFilters>;

export function useMoviesQuery(filters: MovieFilters, language: Ref<string>) {
  /* useQuery: Sirve para pedir datos a la API y que la librería gestione todo automáticamente. */
  /* es el hook principal de @tanstack/vue-query. */
  /* La data que devuelve useQuery tiene la forma de PaginatedResponse<Movie> */
  /* es decir, useQuery va a devolver datos de tipo PaginatedResponse<Movie>. */
  return useQuery<PaginatedResponse<Movie>>({
    /**
     * queryKey define la identidad de la query en Vue Query.
     *
     * Si cualquiera de estos valores cambia,
     * Vue Query vuelve a ejecutar automáticamente la query.
     */
    queryKey: computed(() => [
      // Query base generada por el composable de filtros
      ...filters.queryKey.value,
      // listType se agrega porque define qué endpoint de TMDB se va a usar.
      // Si cambia (por ejemplo discover → popular),
      // Vue Query debe considerar que es una query distinta
      // y volver a ejecutar la request.
      filters.listType.value,
      // El idioma forma parte de la query
      // porque la API devuelve resultados distintos según el language
      language.value,
    ]),

    /**
     * enabled controla cuándo la query puede ejecutarse.
     */
    enabled: computed(
      () =>
        // La query debe ejecutarse cuando:

        // - el usuario selecciona una lista distinta de "discover"
        // - hay texto de búsqueda
        // - hay filtros activos
        // - o simplemente cuando estamos en "discover" como ocurre cuando iniciamos la pagina
        //
        // Nota: esta condición actualmente siempre evalúa true,
        // por lo que la query nunca queda deshabilitada.
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
    queryFn: () => {
      // Página inicial
      const page = 1;

      // Se detiene la query cuando el usuario está escribiendo menos de 3 letras.
      // if (filters.txtMovie.value.trim().length > 0 &&
      //     filters.txtMovie.value.trim().length < 3
      // ) {
      //   return Promise.resolve({
      //     page: 1,
      //     results: [],
      //     total_pages: 0,
      //     total_results: 0,
      //   });
      // }
        
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
  });
}
