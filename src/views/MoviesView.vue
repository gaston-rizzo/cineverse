<script setup lang="ts">

    import MovieFilters from '@/components/movies/MovieFilters.vue'
    import MovieResults from '@/components/movies/MovieResults.vue'
    import MovieCard from '@/components/movies/MovieCard.vue'

    import { useMoviesFilters } from "@/composables/movies/useMovieFilters"
    import { useMoviesQuery } from "@/composables/movies/useMoviesQuery"

    import { useI18n } from "vue-i18n"

    const filters = useMoviesFilters();

    const { locale } = useI18n()
    const apiLanguage = locale

    const { data, isLoading, error } = useMoviesQuery(filters, apiLanguage)

</script>

<template>

  <div class="min-h-screen bg-[#0f0f0f] text-gray-200 p-8 space-y-8">

      <MovieFilters :movieFilters="filters" />

      <MovieResults
        :data="data"
        :isLoading="isLoading"
        :error="error">

          <MovieCard
            v-for="movie in data?.results"
            :key="movie.id"
            :movie="movie"
          />
      
      </MovieResults>

    </div>

</template>