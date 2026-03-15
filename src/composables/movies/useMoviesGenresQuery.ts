/*
 * Composable para obtener los géneros de películas desde la API usando Vue Query.
 *
 * Responsabilidad:
 * Obtener la lista de géneros desde TMDB mediante Vue Query
 * para aprovechar cache, control de carga y manejo de errores.
 *
 * Recibe:
 * - language → idioma de la API (ej: "es", "en")
 *   TMDB devuelve los nombres de los géneros traducidos según este valor.
 *
 * Se cachea prácticamente para siempre porque los géneros casi nunca cambian.
 *
 * Uso:
 * const { data, isLoading, isError } = useMovieGenres(language)
 */

import type { Ref } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { getMovieGenres } from "@/api/movies/movies.service";
import type { Genre } from "@/types/genre";

/**
 * Clave base de Vue Query para la consulta de géneros de películas.
 *
 * Se usa como parte del queryKey para que Vue Query:
 * - Identifique esta consulta en el cache
 * - Reutilice datos cacheados entre componentes
 * - Permita invalidar o refetch de forma centralizada si fuera necesario
 *
 * El idioma se agrega dinámicamente al queryKey para que
 * cada idioma tenga su propio cache de géneros.
 */
const MOVIE_GENRES_QUERY_KEY = "movieGenres";

export function useMovieGenresQuery(language: Ref<string>) {
  // useQuery tipa la propiedad `data` como Genre[]
  return useQuery<Genre[]>({
    // Clave de cache de la query.
    // Si el idioma cambia se vuelven a obtener los generos
    queryKey: [MOVIE_GENRES_QUERY_KEY, language],

    // Función que realiza la llamada HTTP real.
    queryFn: () => getMovieGenres(language.value),

    // Mantener cache mucho tiempo
    gcTime: 1000 * 60 * 60 * 24,
  });
}
