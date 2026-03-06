<!--
Componente de filtros de películas.

Responsabilidad:
Renderizar la UI de filtros y vincularla con el estado reactivo del composable
useMovieFilters.

Este componente es "UI pura":
- No contiene lógica de negocio.
- No llama directamente a la API, pero consume composables de datos.
- Solo muestra controles de filtros y actualiza el estado recibido por props.

Recibe:
movieFilters → objeto devuelto por el composable useMovieFilters().
Contiene el estado reactivo de los filtros y funciones auxiliares.

Los cambios realizados en los controles (input, select, slider, etc.)
actualizan directamente el estado del composable mediante v-model,
lo que provoca que Vue Query re-ejecute automáticamente la búsqueda.

Controles incluidos:
- Búsqueda por texto
- Selección de géneros (chips toggle)
- Rango de años de estreno
- Ordenamiento
- Rango de rating (slider)

Uso:
<MovieFilters :movieFilters="filters" />
-->

<!-- Componente de filtros reutilizable -->

<script setup lang="ts">

    // Vue y librerías externas
    // computed → permite crear valores reactivos derivados de otros valores reactivos.
    // Se actualizan automáticamente cuando cambian las dependencias.
    
    import { computed } from "vue"
    // useI18n → composable de vue-i18n para acceder al idioma actual (locale) y funciones de traducción (t)
    // dentro de un componente usando Composition API.
    import { useI18n } from "vue-i18n";

    // Componentes externos
    import { VueDatePicker } from "@vuepic/vue-datepicker"
    import '@vuepic/vue-datepicker/dist/main.css'    
    import VueSlider from "vue-slider-component"
    import "vue-slider-component/theme/default.css"
    
    // Composables internos
    import { useMovieGenres } from "@/composables/movies/useMovieGenresQuery"

    // Tipos
    import type { MovieFilters } from "@/composables/movies/useMovieFilters"

    const props = defineProps<{
        // recibe los filtros del composable useMovieFilters
        movieFilters: MovieFilters
    }>()

    const {
        txtMovie,
        yearFrom,
        yearTo,
        ratingRange,
        selectedGenres,
        sortBy
    } = props.movieFilters

    // Extraemos la función de traducción
    // {} para sacar la propiedad locale del objeto devuelto por useI18n()
    const { t, locale } = useI18n()

    // Vue Query composable. Se obtienen los generos de la API    
    const { data: movieGenres, isLoading } = useMovieGenres(locale)

    // Evita errores si cambia el composable o es undefined    
    const genres = computed(() => movieGenres.value ?? [])

</script>

<template>

    <div class="filters p-4 bg-[#1a1a1a] rounded mb-4 space-y-4">

        <!-- Búsqueda por texto -->
        <div class="flex items-center gap-2">

            <label for="txtMovie" class="font-medium">{{ t('filters.search') }}</label>
            <input
                type="text"
                id="txtMovie"
                v-model="txtMovie"
                :placeholder="t('filters.searchPlaceholder')"
                class="border border-gray-600 bg-gray-800 text-white rounded px-2 py-1 flex-1" />
            
        </div>

        <!-- Filtro por Género (chips toggle) -->
        <div class="flex flex-wrap gap-2">

            <template v-if="isLoading">
                <span class="px-3 py-1 rounded-full bg-gray-200 animate-pulse w-20 h-6"></span>
                <span class="px-3 py-1 rounded-full bg-gray-200 animate-pulse w-24 h-6"></span>
                <span class="px-3 py-1 rounded-full bg-gray-200 animate-pulse w-16 h-6"></span>
            </template>
            <template v-else>
                <span
                v-for="genre in genres"
                :key="genre.id"
                @click="movieFilters.toggleGenre(genre.id)"
                :class="[
                    'px-3 py-1 rounded-full cursor-pointer transition',
                    selectedGenres.includes(genre.id) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                ]"
                >
                {{ genre.name }}
                </span>
            </template>

        </div>

        <!-- Rango de Año -->
        <div class="flex items-center gap-4 flex-wrap">

            <div class="flex items-center gap-2">

                <label class="font-medium">{{ t('filters.from') }}</label>
                <VueDatePicker
                    v-model="yearFrom"
                    year-picker
                    model-type="year"
                    :placeholder="t('filters.from')"
                />
                
            </div>

            <div class="flex items-center gap-2">

                <label class="font-medium">{{ t('filters.to') }}</label>
                <VueDatePicker
                    v-model="yearTo"
                    year-picker
                    model-type="year"
                    :placeholder="t('filters.to')"
                />

            </div>

        </div>

        <div class="flex flex-col gap-2">

            <label class="font-medium">
            {{ t('filters.rating') }} : {{ movieFilters.ratingRange.value[0] }} – {{ movieFilters.ratingRange.value[1] }}
            </label>

            <VueSlider
            v-model="ratingRange"
            :min="0"
            :max="10"
            :interval="0.5"
            :tooltip="'always'"
            :lazy="true"
            />

        </div>

        <div class="flex items-center gap-2">

            <label class="font-medium"> {{ t('filters.sortBy') }}: </label>

            <select v-model="sortBy" class="border border-gray-600 bg-gray-800 text-white rounded px-2 py-1">
                <option :value="null">{{ t('filters.sortOptions.none') }}</option>
                <option value="popularity.desc">{{ t('filters.sortOptions.mostPopular') }}</option>
                <option value="release_date.desc">{{ t('filters.sortOptions.mostRecent') }}</option>
                <option value="release_date.asc">{{ t('filters.sortOptions.oldest') }}</option>
                <option value="vote_average.desc">{{ t('filters.sortOptions.bestRating') }}</option>
            </select>

        </div>

    </div>

</template>