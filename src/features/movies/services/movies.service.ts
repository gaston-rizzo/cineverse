/**
 *  Módulo de búsqueda de películas
 *
 * Este archivo contiene funciones para interactuar con la API de TMDB y obtener películas según:
 *
 * - Búsqueda por texto (título)
 * - Búsqueda por filtros (géneros, rango de años, ordenamiento)
 * - Búsqueda combinada de texto + filtros aplicados en frontend
 *
 * Funciones principales:
 *
 * 1. getMovieList(listType, page, language)
 *    - Obtiene listas predefinidas de películas desde TMDB.
 *    - Usa endpoints como:
 *        /movie/popular
 *        /movie/now_playing
 *        /movie/upcoming
 *        /movie/top_rated
 *    - Se usa para secciones como Home o Trending.
 *    - Los resultados ya vienen ordenados por TMDB.
 *
 * 2. searchByText(query, page, language)
 *    - Busca películas por texto exacto usando el endpoint /search/movie.
 *    - Retorna la respuesta paginada de TMDB.
 *
 * 3. searchByFilters(page, language, filters)
 *    - Busca películas usando filtros (géneros, rango de años, ordenamiento) sin texto.
 *    - Usa el endpoint /discover/movie que permite filtrar directamente en el backend.
 *
 * 4. searchByTextAndFilters(page, language, filters)
 *    - Combina búsqueda por texto y filtros adicionales.
 *    - Primero busca por texto usando /search/movie.
 *    - Luego aplica manualmente los filtros en frontend.
 *
 * 5. getMovieGenres(language)
 *    - Obtiene la lista de géneros desde /genre/movie/list.
 *    - Se usa para poblar los filtros de género en la interfaz.
 *
 * Tipos utilizados:
 * - Movie: estructura de cada película
 * - PaginatedResponse<Movie>: estructura paginada que devuelve TMDB
 * - DiscoverFilters: filtros que se aplican en /discover/movie
 * - SearchWithFilters: filtros aplicables en frontend junto a la búsqueda de texto
 *
 * NOTA:
 * TMDB limita la combinación de filtros en /search/movie, por eso algunos filtros deben aplicarse
 * en frontend para obtener los resultados correctos.
 */

// Importa la instancia de Axios configurada para llamar a la API de TMDB
import api from "../../../core/api/apiAxios";

// Interfaces locales solo para TS, no se importan en JS runtime
// Se usan únicamente para tipado y autocompletado
import type { Movie } from "@/features/movies/types/movie";
import type { PaginatedResponse } from "@/shared/types/paginated-response";
import type { DiscoverFilters } from "@/features/movies/types/discover-filters";
import type { SearchWithTextAndFilters } from "@/features/movies/types/search-with-text-filters";
import type { Genre } from "@/features/movies/types/genre";
import type { MovieListType } from "@/features/movies/types/movie-list-type";

/* ================================================================================
 * Función que obtiene listas predefinidas de películas
 * usando endpoints directos de TMDB
 *
 * Ejemplos:
 * /movie/popular
 * /movie/now_playing
 * /movie/upcoming
 * /movie/top_rated
 *
 * Estos endpoints ya vienen ordenados por TMDB
 * y no permiten filtros avanzados como discover.
 * ================================================================================ */

export const getMovieList = async (
  listType: MovieListType,
  page: number,
  language: string,
): Promise<PaginatedResponse<Movie>> => {
  const { data } = await api.get<PaginatedResponse<Movie>>(
    `/movie/${listType}`,
    {
      params: {
        page,
        language,
        region: "US",
      },
    },
  );

  return data;
};

/* ================================================================================
 * Función que busca películas sólo por texto usando el endpoint /search/movie
 *
 * Este método se utiliza cuando el usuario escribe algo en la caja de búsqueda.
 * TMDB realiza una búsqueda por coincidencia de texto (título principalmente).
 *
 * Importante:
 * Este endpoint NO permite combinar todos los filtros avanzados
 * (géneros, rango de fechas, rating, etc).
 * Por eso, si se necesitan filtros adicionales,
 * deben aplicarse luego en el frontend.
 * ================================================================================ */

export const searchByText = async (
  query: string,
  page: number,
  language: string,
): Promise<PaginatedResponse<Movie>> => {
  // Llamada al endpoint /search/movie de TMDB usando Axios
  // <PaginatedResponse<Movie>> le indica a TypeScript el tipo de la respuesta:
  // - La respuesta tiene la forma de PaginatedResponse
  // - Dentro de results habrá un array de Movie
  const { data } = await api.get<PaginatedResponse<Movie>>("/search/movie", {
    params: { query, page, language },
  });
  return data;
};

/* ================================================================================
 * Función que busca películas usando los filtros menos el texto 
   usando el endpoint /discover/movie
 * 
 * Este método se usa cuando NO hay texto de búsqueda.
 * Permite aplicar filtros directamente en la API (backend),
 * como géneros, rango de fechas y ordenamiento.
 * ================================================================================ */

export const searchByFilters = async (
  page: number,
  language: string,
  filters: DiscoverFilters = {},
): Promise<PaginatedResponse<Movie>> => {
  // Objeto base de parámetros que siempre se envían
  // page → paginación
  // language → idioma de los resultados
  const params: Record<string, any> = { page, language };

  // Filtro por géneros
  // TMDB espera los géneros como string separado por coma: "28,12,16"
  // Por eso convertimos el array number[] en string
  if (filters.genres?.length) {
    params.with_genres = filters.genres.join(",");
  }

  // Filtro por fecha mínima (desde)
  // Se convierte el año en fecha completa YYYY-01-01
  if (filters.yearFrom) {
    params["primary_release_date.gte"] = `${filters.yearFrom}-01-01`;
  }

  // Filtro por fecha máxima (hasta)
  // Se convierte el año en fecha completa YYYY-12-31
  if (filters.yearTo) {
    params["primary_release_date.lte"] = `${filters.yearTo}-12-31`;
  }

  // Filtro por rating mínimo
  if (filters.minRating !== undefined) {
    params["vote_average.gte"] = filters.minRating;
  }

  // Filtro por rating máximo
  if (filters.maxRating !== undefined) {
    params["vote_average.lte"] = filters.maxRating;
  }

  // Ordenamiento
  // Ej: popularity.desc, vote_average.desc, release_date.asc, etc
  if (filters.sortBy) {
    params.sort_by = filters.sortBy;
  }

  // Llamada real al endpoint /discover/movie
  // Se envían todos los parámetros construidos dinámicamente
  const { data } = await api.get<PaginatedResponse<Movie>>("/discover/movie", {
    params,
  });

  // Retornamos directamente la respuesta de la API
  return data;
};

/* ================================================================================
 * Función que busca películas por texto y aplica filtros adicionales en frontend
 *
 * IMPORTANTE:
 * El endpoint /search/movie de TMDB no permite combinar todos los filtros
 * (géneros, rating, rango de fechas, etc).
 * Por eso:
 *    Primero buscamos por texto
 *    Después aplicamos los filtros manualmente en el frontend
 * ================================================================================ */

export const searchByTextAndFilters = async (
  page: number,
  language: string,
  filters: SearchWithTextAndFilters,
): Promise<PaginatedResponse<Movie>> => {
  // 1. Se busca la película que coincide con el texto ingresado
  // Esto llama internamente al endpoint /search/movie
  const data = await searchByText(filters.query, page, language);

  if (data.results.length === 0) {
    return data;
  }

  // Copiamos los resultados originales para empezar a filtrarlos
  // para no modificar el objeto que vino de la API
  let results = data.results;

  // 2. Filtro por géneros
  // Se mantiene la película si al menos uno de sus genre_ids
  // coincide con alguno de los géneros seleccionados
  if (filters.genres?.length) {
    results = results.filter((movie) =>
      movie.genre_ids?.some((id) => filters.genres!.includes(id)),
    );
  }

  // 3. Filtro por rango de año
  // Solo se ejecuta si el usuario ingresó al menos yearFrom o yearTo
  if (filters.yearFrom || filters.yearTo) {
    // Recorremos cada película y decidimos si se mantiene en la lista
    results = results.filter((movie) => {
      // Si la película no tiene fecha de estreno, la descartamos
      if (!movie.release_date) return false;

      // Convertimos la fecha "YYYY-MM-DD" en año numérico
      const movieYear = new Date(movie.release_date).getFullYear();

      // Caso 1: hay rango completo (desde y hasta)
      // Ej: 2015 - 2022
      if (filters.yearFrom && filters.yearTo) {
        return movieYear >= filters.yearFrom && movieYear <= filters.yearTo;
      }

      // Caso 2: solo año desde (rango abierto hacia adelante)
      // Ej: desde 2018 en adelante
      if (filters.yearFrom) {
        return movieYear >= filters.yearFrom;
      }

      // Caso 3: solo año hasta (rango abierto hacia atrás)
      // Ej: hasta 2010
      if (filters.yearTo) {
        return movieYear <= filters.yearTo;
      }

      // Si por alguna razón no entra en ningún caso,
      // mantenemos la película (fallback de seguridad)
      return true;
    });
  }

  // 4. Filtro por rating mínimo
  // Se mantiene la película si su vote_average es >= minRating
  if (filters.minRating) {
    results = results.filter(
      (movie) => movie.vote_average >= filters.minRating!,
    );
  }

  // 5. Filtro por rating máximo
  // Se mantiene la película si su vote_average es <= maxRating
  if (filters.maxRating) {
    results = results.filter(
      (movie) => movie.vote_average <= filters.maxRating!,
    );
  }

  // 6. Ordenamiento (frontend)
  if (filters.sortBy) {
    switch (filters.sortBy) {
      // Ordenar por popularidad (de mayor a menor)
      // La película más popular queda primero
      case "popularity.desc":
        results = [...results].sort((a, b) => b.popularity - a.popularity);
        break;

      // Ordenar por popularidad (de menor a mayor)
      // La película menos popular queda primero
      case "popularity.asc":
        results = [...results].sort((a, b) => a.popularity - b.popularity);
        break;

      // Ordenar por rating promedio (de mayor a menor)
      // La película mejor puntuada queda primero
      case "vote_average.desc":
        results = [...results].sort((a, b) => b.vote_average - a.vote_average);
        break;

      // Ordenar por rating promedio (de menor a mayor)
      // La película peor puntuada queda primero
      case "vote_average.asc":
        results = [...results].sort((a, b) => a.vote_average - b.vote_average);
        break;

      // Ordenar por fecha de estreno (más nueva primero)
      // Convertimos las fechas "YYYY-MM-DD" a timestamps (number)
      // para poder compararlas correctamente
      case "release_date.desc":
        results = [...results].sort(
          (a, b) =>
            new Date(b.release_date ?? 0).getTime() -
            new Date(a.release_date ?? 0).getTime(),
        );
        break;

      // Ordenar por fecha de estreno (más vieja primero)
      case "release_date.asc":
        results = [...results].sort(
          (a, b) =>
            new Date(a.release_date ?? 0).getTime() -
            new Date(b.release_date ?? 0).getTime(),
        );
        break;
    }
  }

  // 7. Retornamos la respuesta final
  // Mantenemos la estructura original de TMDB,
  // pero reemplazamos results y total_results
  return {
    ...data,
    results,
    total_results: results.length,
  };
};

/* ================================================================================
 * Función que obtiene la lista de géneros de películas desde TMDB
 *
 * Este endpoint devuelve todos los géneros disponibles para películas.
 *
 * Ejemplo de respuesta:
 *
 * [
 *   { id: 28, name: "Action" },
 *   { id: 35, name: "Comedy" },
 *   { id: 18, name: "Drama" }
 * ]
 *
 * Parámetros:
 * - language → idioma en el que TMDB devolverá el nombre del género
 *              (ej: "en-US", "es-ES")
 *
 * Nota:
 * La función devuelve directamente el array de géneros,
 * no la respuesta completa de TMDB.
 * ================================================================================ */

export const getMovieGenres = async (language: string): Promise<Genre[]> => {
  const { data } = await api.get("/genre/movie/list", {
    params: { language },
  });

  return data.genres;
};
