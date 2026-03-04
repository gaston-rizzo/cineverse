
<script setup lang="ts">

    import { watch, ref, computed } from "vue"
    import { useQuery } from '@tanstack/vue-query'
    
    import { useAppStore } from '@/stores/useAppStore'
    
    import { mapLanguageToApi } from "@/utils/mapLanguage"

    import { searchByText, searchByFilters, searchByTextAndFilters } from "@/api/movie/movie.service"

    import { VueDatePicker } from "@vuepic/vue-datepicker"

    import '@vuepic/vue-datepicker/dist/main.css'
    import 'vue-slider-component/theme/default.css'

    import VueSlider from 'vue-slider-component'

    // Importamos el composable de vue-i18n
    import { useI18n } from 'vue-i18n'

    // Extraemos la función de traducción
    const { t } = useI18n()
    
    // Usamos el store
    const appStore = useAppStore()

    // =====================================================================================
    // caja de texto de la pelicula
    const txtMovie = ref("")
    const debouncedQuery = ref("");

    // =====================================================================================
    // Géneros  
    // Ejemplo: la lista de géneros la podés traer de TMDB o hardcodearla
    const genresList = [
      { id: 28, name: 'Acción' },
      { id: 12, name: 'Aventura' },
      { id: 16, name: 'Animación' },
      { id: 35, name: 'Comedia' },
      { id: 80, name: 'Crimen' },
      { id: 99, name: 'Documental' },
      { id: 18, name: 'Drama' },
      { id: 10751, name: 'Familia' },
      { id: 14, name: 'Fantasía' },
      { id: 36, name: 'Historia' },
      { id: 27, name: 'Terror' },
      { id: 10402, name: 'Música' },
      { id: 9648, name: 'Misterio' },
      { id: 10749, name: 'Romance' },
      { id: 878, name: 'Ciencia ficción' },
      { id: 10770, name: 'Película de TV' },
      { id: 53, name: 'Thriller' },
      { id: 10752, name: 'Bélica' },
      { id: 37, name: 'Western' }
    ]

    const selectedGenres = ref<number[]>([])

    const toggleGenre = (id: number) => {

      // Si el género seleccionado esta en la lista de generos seleccionados
      if (selectedGenres.value.includes(id)) {        
        // Si el género ya estaba seleccionado → lo deseleccionamos
        selectedGenres.value = selectedGenres.value.filter(g => g !== id)
      } else {        
        // Si no estaba seleccionado lo agregamos a la lista
        selectedGenres.value.push(id)
      }

    }

    // =====================================================================================
    // Fechas 

    const yearFrom = ref<number | null>(null)
    const yearTo = ref<number | null>(null)

    // =====================================================================================
    // Ordenar por

    const sortBy = ref<string | null>(null)

    // =====================================================================================
    // Slider de rating

    const ratingRange = ref<[number, number]>([0, 10])

    const minRating = computed(() => ratingRange.value[0])
    const maxRating = computed(() => ratingRange.value[1])

    /* ------------------------------------------------------------------------------------- */

    const apiLanguage = computed(() =>
        mapLanguageToApi(appStore.language)
  )

  // guardamos el timeout fuera del watch
  let timeout: number | undefined; 
 
  // DEBOUNCE - la funcion para buscar pelicula solo se ejecuta despues de un tiempo
  // Se vigila la caja de texto Movie
  watch(txtMovie, (value) => {
    // Se resetea el timeout
    clearTimeout(timeout)
    // window.setTimeout evita problemas de tipos en TS.
    // Si pasan los 500 ms entonces se pasa el valor de txtMovie a debounceQuery
    // para poder ejecutar la funcion para buscar la pelicula
    timeout = window.setTimeout(() => {
      debouncedQuery.value = value
    }, 500)
  })

  const hasText = computed(() => debouncedQuery.value.length >= 3);

  const hasFilters = computed(() =>

      selectedGenres.value.length > 0 ||
      yearFrom.value !== null ||
      yearTo.value !== null ||
      sortBy.value !== null ||
      ratingRange.value[0] > 0 || // minRating cambiado
      ratingRange.value[1] < 10   // maxRating cambiado

  )

  /*
  queryKey sirve para identificar un request.

  Es la clave única que usa Vue Query para:

      Guardar el resultado en cache
      Saber si ya tiene esos datos y devolver cache
      Decidir cuándo volver a ejecutar la query

  Si la key cambia → Vue Query:

      Busca en cache
      Si no existe → ejecuta de nuevo
      Si existe → devuelve cache
      Todo lo que afecte el resultado debe estar en la key

      Ejemplo:
          ['movies', 'batman', [28], 'es']
      significa:
          "Dame películas con texto batman, género acción (28), idioma español"
      Si se cambia algo:
        ['movies', 'batman', [28], 'en']
      Ya no es lo mismo → Vue Query ejecuta de nuevo.
  */
  const queryKey = computed(() => [

      "movies",
      debouncedQuery.value || null,
      [...selectedGenres.value].sort(),
      yearFrom.value,
      yearTo.value,
      minRating.value,
      maxRating.value,
      sortBy.value,
      // Se incluye apiLanguage en la queryKey porque cambia el resultado; 
      // sin eso Vue Query devolvería cache en otro idioma y no re-ejecutaría la query.
      apiLanguage.value

  ])

  const { data, isLoading, error } = useQuery({

    queryKey,
    enabled: computed(() => hasText.value || hasFilters.value),
    queryFn: () => {

        // Caso 1: solo texto
        if (hasText.value && !hasFilters.value) {

          // Se busca la pelicula por el texto
          return searchByText(
                debouncedQuery.value, 
                1, 
                apiLanguage.value)

        }

        // Caso 2: solo filtros      
        else if (!hasText.value && hasFilters.value)  {

          // Se buscan las pelicula por filtro
          return searchByFilters(
            1,
            apiLanguage.value,
            {
                genres: selectedGenres.value,
                yearFrom: yearFrom.value ?? undefined,
                yearTo : yearTo.value ?? undefined,
                minRating : minRating.value,
                maxRating : maxRating.value,
                sortBy : sortBy.value ?? undefined
            }
          )
        }

        // Caso 3: texto + filtros
        else if (hasText.value && hasFilters.value) {
          return searchByTextAndFilters(
            1,
            apiLanguage.value,
            {
              query: debouncedQuery.value,
              genres: selectedGenres.value,
              yearFrom : yearFrom.value ?? undefined,
              yearTo : yearTo.value ?? undefined,
              minRating : minRating.value,
              maxRating: maxRating.value,
              sortBy : sortBy.value ?? undefined
            }
          )
        }

    }

  })

</script>

<template>

  <!-- <div>
    <h1>Movies</h1>
    <p>Mode: {{ mode }}</p>
    <p v-if="query">Query: {{ query }}</p>
  </div> -->

  <h1>{{ t('movies.title') }}</h1>

  <div class="filters p-4 bg-gray-50 rounded mb-4 space-y-4">

    <!-- Búsqueda por texto -->
    <div class="flex items-center gap-2">

      <label for="txtMovie" class="font-medium">Buscar:</label>
      <input
          type="text"
          id="txtMovie"
          v-model="txtMovie"
          placeholder="Escribí mínimo 3 caracteres"
          class="border rounded px-2 py-1 flex-1"
        />

    </div>

    <!-- Filtro por Género (chips toggle) -->
    <div class="flex flex-wrap gap-2">
      <span
        v-for="genre in genresList"
        :key="genre.id"
        @click="toggleGenre(genre.id)"
        :class="[
          'px-3 py-1 rounded-full cursor-pointer transition',
          selectedGenres.includes(genre.id) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
        ]"
      >
        {{ genre.name }}
      </span>
    </div>

    <!-- Rango de Año -->
    <div class="flex items-center gap-4 flex-wrap">

        <div class="flex items-center gap-2">
          <label class="font-medium">Desde:</label>
          <VueDatePicker
            v-model="yearFrom"
            year-picker
            model-type="year"
            placeholder="Desde"
          />
        </div>

        <div class="flex items-center gap-2">
          <label class="font-medium">Hasta:</label>
          <VueDatePicker
            v-model="yearTo"
            year-picker
            model-type="year"
            placeholder="Hasta"
          />
        </div>

    </div>

    <div class="flex items-center gap-2">

      <label class="font-medium">Ordenar:</label>
      <select v-model="sortBy" class="border rounded px-2 py-1">
        <option :value="null">Sin ordenar</option>
        <option value="popularity.desc">Más populares</option>
        <option value="release_date.desc">Más recientes</option>
        <option value="release_date.asc">Más antiguos</option>
        <option value="vote_average.desc">Mejor rating</option>
      </select>

    </div>

    <div class="flex flex-col gap-2">

        <label class="font-medium">
          Rating: {{ ratingRange[0] }} – {{ ratingRange[1] }}
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

</div>

  <p v-if="isLoading">
        Cargando...
  </p>
  <p v-else-if="error">
        Error al cargar
        {{ error }}
  </p>
<div v-else-if="data">
  <ul>
    <li v-for="movie in data.results" :key="movie.id">
      {{ movie.title }} - {{ movie.release_date }}
    </li>
  </ul>
</div>

</template>