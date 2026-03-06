/*
 * Representa la estructura de respuesta paginada de la API de películas.
 * Usada tanto en /search/movie como en /discover/movie.
 * 
 * Genérica para poder manejar cualquier tipo de resultados (T), normalmente Movie.
 */
export interface PaginatedResponse<T> {

    /** Página actual de los resultados */
    page: number
    /** Lista de resultados de tipo genérico T (por ejemplo Movie) */
    results: T[]
    /** Total de páginas disponibles según la consulta */
    total_pages: number
    /** Total de resultados disponibles según la consulta */
    total_results: number
}