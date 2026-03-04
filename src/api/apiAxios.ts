
/**
 * Este archivo configura y exporta una instancia de Axios personalizada
 * para consumir la API de TMDB (The Movie Database).
 *
 * Contiene:
 *  - URL base de la API tomada de las variables de entorno
 *  - Token de autenticación Bearer
 *  - Configuración de headers por defecto
 *
 * La instancia "api" se importa en los servicios de películas
 * para realizar todas las llamadas HTTP a TMDB de manera consistente.
 */

import axios from 'axios'

// Base URL de la API de TMDB tomada de las variables de entorno
const baseURL = import.meta.env.VITE_TMDB_BASE_URL;

// Token de autorización para acceder a la API de TMDB (Bearer Token)
const token = import.meta.env.VITE_TMDB_TOKEN;

// Se crea una instancia personalizada de Axios para hacer llamadas a TMDB
// Esto permite reutilizar la configuración base (URL, headers) en toda la app
const api = axios.create({
  baseURL: baseURL, // URL base de todas las peticiones
  headers: {
    Authorization: `Bearer ${token}`, // Autenticación con Bearer Token
    'Content-Type': 'application/json' // Tipo de contenido enviado y recibido
  }
})

// Exportamos la instancia para usarla en otros módulos
export default api