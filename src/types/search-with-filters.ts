
/**
 * Representa los filtros que se pueden aplicar al buscar películas combinando
 * texto + filtros adicionales en frontend.
 *
 * Esta interfaz se usa en la función `searchByTextAndFilters`.
 */

import type { BaseFilters } from "./base-filter";

export interface SearchWithFilters extends BaseFilters {

    /** Texto que ingresa el usuario para buscar películas (obligatorio) */
    query: string
}