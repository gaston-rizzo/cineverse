/*
 * Configuración de Internacionalización (i18n)
 *
 * Este archivo configura vue-i18n para permitir
 * soporte multi-idioma en la aplicación.
 *
 * Responsabilidades:
 *
 * - Definir idiomas disponibles
 * - Establecer idioma por defecto
 * - Configurar idioma de respaldo (fallback)
 * - Integrar archivos de traducción
 *
 * Se utiliza Composition API (legacy: false)
 * para trabajar con useI18n() dentro de los componentes.
 */

import { createI18n } from "vue-i18n";

// Importamos los archivos de traducción
// Cada uno contiene los textos organizados por claves
import en from "./en.json";
import es from "./es.json";

// Creamos la instancia global de i18n
const i18n = createI18n({
  // legacy: false permite usar Composition API
  // (useI18n dentro de setup())
  legacy: false,

  // Idioma inicial por defecto
  // Luego lo sincronizamos dinámicamente con el router (:lang)
  locale: "es",

  // Idioma de respaldo en caso de que falte
  // alguna clave de traducción
  fallbackLocale: "en",

  // Registramos los mensajes disponibles
  // La clave debe coincidir con el :lang del router
  messages: {
    en,
    es,
  },
});

// Exportamos la instancia para usarla en main.ts
export default i18n;
