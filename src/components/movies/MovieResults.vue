<script setup lang="ts">

    import type { PaginatedResponse } from '@/types/paginatedResponse'
    import type { Movie } from "@/types/movie"

     import { useI18n } from "vue-i18n";
     
    // Extraemos la función de traducción
    const { t } = useI18n()

    defineProps<{
        data: PaginatedResponse<Movie> | undefined,
        isLoading: boolean,
        error: unknown
    }>()

</script>

<template>    

    <p v-if="isLoading" class="text-gray-400">
        <label for="txtMovie" class="font-medium">{{ t('common.loading') }}</label>
    </p>
    <p v-else-if="error" class="text-red-500">
        {{ t('common.error') }}
        <br>
        {{ error }}
    </p>

    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <slot />
    </div>

</template>