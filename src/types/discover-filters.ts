/*
 * Representa los filtros que se pueden aplicar al buscar películas
 * usando el endpoint /discover/movie (sin texto) o similares.
 * 
 * Permite filtrar por géneros, rango de años, ordenamiento y opcionalmente por texto.
 * Esta interfaz se usa en la función "searchByFilters".
 */

import type { BaseFilters } from "./base-filter"

export interface DiscoverFilters extends BaseFilters {
}