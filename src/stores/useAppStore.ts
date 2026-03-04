
/*
 * =================================
 * Configuración global del sitio   
 * =================================
   
 * Store que centraliza configuraciones globales de la aplicación
 * que deben estar disponibles en cualquier vista o componente.
 *
 * Responsabilidades:
 * 
 * Manejo del tema visual principal (cinematic dark)
 *
 * Se utiliza persistencia para conservar preferencias del usuario
 * incluso después de recargar la página (localStorage).
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore(
  'app',
  () => {

    // CineVerse es dark-first, sin modo light
    const theme = ref<'cinematic-dark'>('cinematic-dark')

    return {
      theme
    }
  },
  {
    persist: true
  }
)