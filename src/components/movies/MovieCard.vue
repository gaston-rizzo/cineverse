<script setup lang="ts">

    defineProps<{
        movie: any
    }>()

</script>

<template>
    
  <div
    class="bg-[#1f1f1f] rounded-xl overflow-hidden
           hover:scale-105 transition-transform duration-300
           shadow-lg hover:shadow-red-600/20"
  >
    <img
      :src="`https://image.tmdb.org/t/p/w500${movie.poster_path}`"
      class="w-full h-80 object-cover"
    />

    <div class="p-4">
      <h3 class="text-gray-200 font-semibold">
        {{ movie.title }}
      </h3>

      <p class="text-sm text-gray-400">
        {{ movie.release_date }}
      </p>
    </div>
  </div>

</template>