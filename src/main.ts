/*
 * ======================================
 * Punto de entrada de la aplicación
 * ======================================
 *
 * Este archivo es el punto de entrada principal de la aplicación.
 *
 * Responsabilidades:
 *
 * - Crear la instancia raíz de Vue
 * - Registrar plugins globales (Router, Pinia, Vue Query)
 * - Configurar persistencia de estado
 * - Montar la aplicación en el DOM
 *
 * Acá se inicializa la arquitectura base de la SPA,
 * conectando navegación, estado global y manejo de datos.
 */

// Importamos la función principal para crear la app Vue
import { createApp } from "vue";
// Componente raíz de la aplicación
import App from "./App.vue";
// Importamos el router configurado (rutas y navegación)
import router from "./router";
// Importamos Pinia para manejo de estado global
import { createPinia } from "pinia";
// Plugin para persistir el estado (ej: favoritos) en localStorage
import piniaPluginPersistedState from "pinia-plugin-persistedstate";
// Plugin de Vue Query para manejo de fetch, cache y estado asíncrono
import { VueQueryPlugin } from "@tanstack/vue-query";
// Importamos tailwind
import "./assets/main.css";
// Importamos la librería de internacionalización (vue-i18n)
import i18n from "./i18n";
// Importamos libreria de animaciones
import { MotionPlugin } from "@vueuse/motion";

// Creamos la instancia de Pinia
const pinia = createPinia();

// Aplicamos el plugin de persistencia al store
// Permite mantener datos aunque el usuario recargue la página
pinia.use(piniaPluginPersistedState);

// Creamos la aplicación Vue
createApp(App)
  // Registramos Pinia como sistema de estado global
  .use(pinia)
  // Registramos el router para habilitar navegación SPA
  .use(router)
  // Registramos Vue Query para manejo avanzado de requests y cache
  .use(VueQueryPlugin)
  // Registramos el plugin vue-i18n para habilitar traducciones globales
  .use(i18n)
  // Registramos las animaciones
  .use(MotionPlugin)
  // Montamos la aplicación en el div con id="app" del index.html
  .mount("#app");
