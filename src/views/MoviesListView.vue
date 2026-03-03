
<script setup lang="ts">

    import { useRoute } from 'vue-router'

    const route = useRoute()

    const mode = route.query.mode ?? 'discover'
    const query = route.query.q ?? null

</script>

<template>

  <div>
    <h1>Movies</h1>
    <p>Mode: {{ mode }}</p>
    <p v-if="query">Query: {{ query }}</p>
  </div>
  
</template>