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

import { computed } from "vue"
import type { Ref } from "vue"
import { useQuery } from "@tanstack/vue-query"

import type { PaginatedResponse } from "@/types/paginatedResponse"
import type { Movie } from "@/types/movie"

import {
  searchByText,
  searchByFilters,
  searchByTextAndFilters
} from "@/api/movie/movie.service"

export function useMoviesQuery(filters: any, language: Ref<string>) {

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

      "movies",
      // Query base generada por el composable de filtros
      ...filters.queryKey.value,
      // El idioma forma parte de la query
      // porque la API devuelve resultados distintos según el language
      language

    ]),

    /**
     * enabled controla cuándo la query puede ejecutarse.
     *
     * Evitamos hacer requests innecesarios cuando
     * no hay texto ni filtros activos.
     */
    enabled: computed(() =>

      filters.hasText.value ||
      filters.hasFilters.value

    ),

    /**
     * queryFn es la función que ejecuta la llamada a la API.
     *
     * Siempre debe devolver:
     * Promise<PaginatedResponse<Movie>>
     */
    queryFn: () => {

      // Página inicial (luego podrías hacerlo dinámico)
      const page = 1

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

        sortBy: filters.sortBy.value ?? undefined

      }

      /**
       * Caso 1
       * Texto + filtros
       */
      if (filters.hasText.value && filters.hasFilters.value) {

        return searchByTextAndFilters(
          page,
          language.value,
          {
            query: filters.debouncedQuery.value,
            // crea un objeto con query y después agrega todas las propiedades que tenga filterOptions
            ...filterOptions
          }
        )

      }

      /**
       * Caso 2
       * Solo texto
       */
      if (filters.hasText.value) {

        return searchByText(
          filters.debouncedQuery.value,
          page,
          language.value
        )

      }

      /**
       * Caso 3
       * Solo filtros
       */
      return searchByFilters(
        page,
        language.value,
        filterOptions
      )

    }

  })

}