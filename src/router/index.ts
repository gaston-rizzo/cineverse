
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

// Importamos la instancia de i18n para sincronizar idioma con la ruta
import i18n from '../i18n'

const router = createRouter({

  // Usamos history mode sin hash (#)
  // de esta forma se puede usar /en/movies
  // import.meta.env.BASE_URL permite que funcione correctamente
  // tanto en desarrollo como en producción (subcarpetas incluidas)
  history: createWebHistory(import.meta.env.BASE_URL),
  // Rutas de la aplicación
  routes: [

    // Detecta idioma del navegador, si es español 
    // traduce el sitio a español, sino a ingles    
    // Solo se ejecuta cuando se ingresa a "/"
    // No afecta navegación interna
    {
      path: '/',
      redirect: () => {

        // Detecta idioma del navegador (ej: es-AR, en-US)
        const browserLang = navigator.language.toLowerCase()

        // Si empieza con "es" → va a español
        if (browserLang.startsWith('es')) {
          return '/es'
        }

        // En cualquier otro caso → inglés
        return '/en'
      }
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

// ==========================================
// Sincronización automática Router ↔ i18n
// ==========================================

// beforeEach: Es una función que se ejecuta antes de cada cambio de ruta.

// Cada vez que el usuario:
//    Hace click en un <router-link>
//    Es redirigido
//    Escribe una URL nueva
//    Cambia de /en a /es
// beforeEach se ejecuta antes de que Vue cargue la nueva vista.

// Cada vez que cambia la URL:
// Lee :lang
// Si es "en" o "es"
// Cambia el idioma de vue-i18n

// Si vas a:
//     /en/movies
//     Idioma → inglés

// Si vas a:
//   /es/movies
//   Idioma → español

// Guard global que se ejecuta antes de cada navegación
// un guard global es una función que se ejecuta antes
//  o después de una navegación.
router.beforeEach((to, _from, next) => {

  // Obtenemos el parámetro dinámico :lang desde la URL
  // Ej: /en/movies → lang = "en"
  //     /es        → lang = "es"
  const lang = to.params.lang

  // Verificamos que el idioma sea válido
  // (solo aceptamos "en" o "es")
  if (lang === 'en' || lang === 'es') {

    // Actualizamos el idioma global de vue-i18n
    // para que toda la app cambie automáticamente
    i18n.global.locale.value = lang
  }

  // Permitimos que la navegación continúe
  // Si no llamamos next(), la ruta queda bloqueada
  next()
})

// Exportamos el router para usarlo en main.ts
export default router