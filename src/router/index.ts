
/*
 * =================================
 * Configuración de rutas  
 * =================================
 * 
 * Este archivo define la configuración central de navegación 
 * de la aplicación utilizando Vue Router.
 *
 * Responsabilidades:
 * 
 * - Declarar las rutas principales (views)
 * - Configurar el modo history (sin hash)
 * - Manejar redirecciones iniciales
 * - Validar parámetros dinámicos (ej: idioma :lang)
 *
 * Actúa como el sistema de navegación de la SPA, conectando 
 * las URLs con sus respectivas vistas.
 */

// Importamos las funciones necesarias de Vue Router
import { createRouter, createWebHistory } from 'vue-router'

// Importamos las vistas (pages) principales de la aplicación
import HomeView from '../views/HomeView.vue'
import MoviesListView from '../views/MoviesListView.vue'

const router = createRouter({

  // Usamos history mode sin hash (#)
  // de esta forma se puede usar /en/movies
  // import.meta.env.BASE_URL permite que funcione correctamente
  // tanto en desarrollo como en producción (subcarpetas incluidas)
  history: createWebHistory(import.meta.env.BASE_URL),
  // Rutas de la aplicación
  routes: [

    // Redirecciona "/" al idioma por defecto y al home cinematográfico
    {
      path: '/',
      redirect: '/en'
    },

    // Ruta para Home por idioma
    // Valida que :lang sea solo 'en' o 'es'
    // Evita rutas inválidas como: /asdf/movies
    {
      path: '/:lang(en|es)',
      name: 'Home',
      component: HomeView
    },

    // Ruta para el listado de películas
    {
      path: '/:lang(en|es)/movies',
      name: 'Movies',
      component: MoviesListView
    }    
]
})

// Exportamos el router para usarlo en main.ts
export default router