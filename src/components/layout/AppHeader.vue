<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import logo from "@/assets/logo.png";

const { t, locale } = useI18n();

const router = useRouter();
const route = useRoute();

const searchQuery = ref("");
const scrolled = ref(false);

onMounted(() => {
  // Cuando el componente se monta en el DOM, agregamos el listener de scroll
  // Esto permite que `handleScroll` se ejecute cada vez que el usuario haga scroll
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  // Cuando el componente se desmonta, eliminamos el listener
  // Evita memory leaks o que el listener siga corriendo en componentes destruidos
  window.removeEventListener("scroll", handleScroll);
});

/* =======================================================================================
 * Esta función detecta el movimiento de scroll vertical del usuario
 * y actualiza el estado reactivo `scrolled`.
 *
 * Flujo:
 * 1. Se obtiene la posición actual del scroll vertical con `window.scrollY`.
 * 2. Si el scroll supera los 40 píxeles, se marca `scrolled.value = true`.
 *    De lo contrario, se marca `false`.
 * 3. El valor de `scrolled` se usa en el template para:
 *    - Cambiar estilos del header (por ejemplo, aplicar blur o fondo traslúcido).
 *    - Ocultar o mostrar elementos visuales como gradientes o sombras.
 *
 * Nota: Esta función se ejecuta cada vez que el usuario hace scroll,
 * y es vinculada al evento `scroll` en `onMounted`.
 * ======================================================================================= */

function handleScroll() {
  // window.scrollY devuelve la posición vertical actual del scroll
  // Si el scroll es mayor a 40px, marcamos `scrolled.value = true`
  // Esto sirve para activar efectos visuales como blur, fondo traslúcido, etc.
  scrolled.value = window.scrollY > 40;
}

/* =======================================================================================
 * handleSearch
 *
 * Esta función se encarga de tomar el valor actual del input de búsqueda
 * y redirigir al usuario a la página de películas ("Movies") con la query
 * correspondiente en la URL.
 *
 * Flujo:
 * 1. Obtiene el texto ingresado y elimina espacios al inicio y al final.
 * 2. Valida que haya al menos 3 caracteres; si no, no hace nada.
 * 3. Usa Vue Router para navegar a la ruta "Movies", pasando:
 *    - El idioma actual como parámetro.
 *    - El término de búsqueda como query.
 *
 * Esto permite que la URL refleje la búsqueda y que la página de Movies
 * pueda reaccionar automáticamente mostrando los resultados filtrados.
 * ======================================================================================= */

function handleSearch() {
  // Obtenemos el valor actual del input de búsqueda y eliminamos espacios al inicio y final
  const query = searchQuery.value.trim()

  // Si el input está vacío después de limpiar espacios, no hacemos nada
  if (!query) return

  // Si la longitud del texto es menor a 3 caracteres, tampoco hacemos nada
  // Esto evita búsquedas inútiles que podrían saturar la API o devolver demasiados resultados irrelevantes
  if (query.length < 3) return

  // Redirige al usuario a la página de "Movies" usando Vue Router
  //    - Manteniendo el idioma actual en params
  //    - Pasando el término de búsqueda en query
  // Esto permite que la URL refleje la búsqueda y que la página de películas
  // pueda reaccionar automáticamente y mostrar los resultados filtrados
  router.push({
    name: "Movies",
    params: {
      lang: route.params.lang // idioma actual de la ruta
    },
    query: {
      search: query // el término de búsqueda que activará la búsqueda en Movies
    }
  })
}

/* =======================================================================================
 * Esta función cambia el idioma de la aplicación manteniendo la ruta y los parámetros actuales.
 *
 * Parámetro:
 * - lang: string → el código del idioma al que queremos cambiar (por ejemplo, "es" o "en").
 *
 * Flujo:
 * 1. Toma el nombre de la ruta actual (`route.name`) para no cambiar de página.
 * 2. Copia todos los parámetros actuales de la ruta usando spread (`...route.params`).
 * 3. Sobrescribe el parámetro `lang` con el nuevo idioma.
 * 4. Usa `router.push` para actualizar la URL y forzar que la aplicación
 *    muestre la misma ruta pero en el idioma seleccionado.
 *
 * Esto permite que el cambio de idioma:
 * - No recargue la página.
 * - Mantenga la navegación actual.
 * - Actualice automáticamente los componentes reactivos que dependen de "locale".
 /* ======================================================================================= */

function switchLang(lang: string) {
  router.push({
    name: route.name as string,

    // ...params copia todas las propiedades
    params: { ...route.params, lang },
  });
}

const collapsed = ref(false)

/* =======================================================================================
 * Alterna el estado del header entre expandido y colapsado.
 *
 * Flujo:
 * 1. Cambia el valor reactivo `collapsed` a su opuesto (`true` → `false`, `false` → `true`).
 * 2. Este valor se usa en el template para:
 *    - Reducir la altura del header.
 *    - Ajustar tamaños de logo, navegación, y campo de búsqueda.
 *
 * Esto permite que el usuario pueda plegar o expandir el header de forma interactiva
 * manteniendo la animación suave definida en CSS.
 * ======================================================================================= */

function toggleHeader(){
  collapsed.value = !collapsed.value
}

</script>

<template>
  <header class="app-header" :class="{ scrolled, collapsed }">

  <!-- DEGRADADO CINEMATOGRÁFICO -->
  <!-- gradiente solo cuando NO hay scroll -->
  <div class="header-gradient" :class="{ hidden: scrolled }"></div>

    <div class="header-container">
      <!-- LOGO -->
      <RouterLink
        :to="{ name: 'Home', params: { lang: locale } }"
        class="logo-group"
      >
        <img :src="logo" alt="CineVerse" class="logo" />

        <span class="logo-text">
          <span class="logo-shine"></span>
          CineVerse
        </span>
      </RouterLink>

      <!-- NAV -->
      <nav class="nav">
        <RouterLink
          :to="{ name: 'Home', params: { lang: locale } }"
          class="nav-item"
        >
          {{ t("nav.home") }}
        </RouterLink>

        <RouterLink
          :to="{ name: 'Movies', params: { lang: locale } }"
          class="nav-item"
        >
          {{ t("nav.movies") }}
        </RouterLink>

        <RouterLink
          :to="{ name: 'Upcoming', params: { lang: locale } }"
          class="nav-item"
        >
          {{ t("nav.upcoming") }}
        </RouterLink>

        <RouterLink
          :to="{ name: 'Favorites', params: { lang: locale } }"
          class="nav-item"
        >
          {{ t("nav.favorites") }}
        </RouterLink>
      </nav>

      <!-- RIGHT SIDE -->
      <div class="right-side">
        <!-- SEARCH -->
        <form @submit.prevent="handleSearch">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('header.searchPlaceholder')"
            class="search"
          />
        </form>

        <!-- LANGUAGE -->
        <div class="lang-switch">
          <button
            @click="switchLang('es')"
            :class="{ active: locale === 'es' }"
          >
            ES
          </button>

          <button
            @click="switchLang('en')"
            :class="{ active: locale === 'en' }"
          >
            EN
          </button>
        </div>
      </div>
    </div>

    <button class="collapse-btn" @click="toggleHeader">
      <svg
        class="collapse-icon"
        :class="{ rotated: collapsed }"
        viewBox="0 0 24 24"
      >
        <path d="M6 15l6-6 6 6"/>
      </svg>
    </button>

  </header>

</template>

<style scoped>

/* ##################################################################### 
/* HEADER PRINCIPAL 
/* ##################################################################### */

/* Barra fija en la parte superior con transición suave */
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 130px;
  display: flex;
  align-items: center;
  overflow: visible;
  transition: all 0.35s ease;
}

/* LÍNEA LUMINOSA INFERIOR
   Da un borde cinematográfico al header */
.app-header::before{
  content:"";
  position:absolute;
  bottom:0;
  left:0;
  width:100%;
  height:2px;

  background:linear-gradient(
    90deg,
    transparent 0%,
    rgba(229,9,20,.8) 20%,
    rgba(255,255,255,.9) 50%,
    rgba(229,9,20,.8) 80%,
    transparent 100%
  );

  box-shadow:
    0 0 10px rgba(229,9,20,.6),
    0 0 20px rgba(229,9,20,.4),
    0 0 40px rgba(229,9,20,.3);

  pointer-events:none;
}

/* ESTADO SCROLL
   Header tipo vidrio cuando el usuario baja */
.app-header.scrolled {
  backdrop-filter: blur(12px);
  background: rgba(11, 15, 25, 0.45);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7);
}

/* OCULTAR GRADIENTE
   Se usa cuando el header entra en modo scroll */
.header-gradient.hidden{
  opacity:0;
  transition:opacity .35s ease;
  pointer-events:none;
}

/* GRADIENTE CINEMATOGRÁFICO
   Fondo dinámico del header al inicio */
.header-gradient {
  position: absolute;
  inset: 0;
  z-index: -1;

  background: linear-gradient(
    90deg,
    #0b0f19 0%,
    #121826 15%,
    #1b1f3a 35%,
    #3b1d36 55%,
    #5a1a23 70%,
    #1b1f3a 85%,
    #0b0f19 100%
  );

  /* sombras internas para profundidad */
  box-shadow:
    inset 0 40px 80px rgba(0, 0, 0, 0.6),
    inset 0 -40px 80px rgba(0, 0, 0, 0.7);

  /* animación lenta del gradiente */
  background-size: 200% 100%;
  animation: cinemaMove 18s ease-in-out infinite;
}

/* ANIMACIÓN DEL GRADIENTE */
@keyframes cinemaMove {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* CAPA DE RUIDO
   Simula textura cinematográfica */
.app-header::after{
  content:"";
  position:absolute;
  inset:0;

  background-image:url("/noise.png");
  opacity:.06;

  pointer-events:none;
}

/* header colapsado */
.app-header.collapsed{
  height:60px;
}

/* achica logo y nav */
.app-header.collapsed .logo{
  height:50px;
}

.app-header.collapsed .logo-text{
  font-size:28px;
}

.app-header.collapsed .nav{
  gap:28px;
}

.app-header.collapsed .search{
  width:180px;
}

/* ##################################################################### */
/* CONTENEDOR 
/* ##################################################################### */

/* Limita el ancho del contenido del header */
.header-container {
  max-width: 1600px;
  width: 100%;

  margin: auto;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0 60px;
}

/* GRUPO LOGO */
.logo-group {
  display: flex;
  align-items: center;
  gap: 22px;
  text-decoration: none;
}

/* LOGO IMAGEN */
.logo {
  height: 88px;

  filter: drop-shadow(0 0 12px rgba(229, 9, 20, 0.6))
    drop-shadow(0 0 28px rgba(229, 9, 20, 0.4));

  transition: transform 0.4s ease;
}

/* EFECTO HOVER DEL LOGO */
.logo-group:hover .logo {
  transform: scale(1.12) rotate(-2deg);

  filter: drop-shadow(0 0 18px rgba(229, 9, 20, 0.8))
    drop-shadow(0 0 40px rgba(229, 9, 20, 0.6));
}

/* TEXTO DEL LOGO */
.logo-text {
  position: relative;

  font-size: 48px;
  font-weight: 900;
  letter-spacing: 2px;

  color: white;

  text-shadow:
    0 0 10px rgba(255, 255, 255, 0.2),
    0 0 25px rgba(229, 9, 20, 0.4);

  overflow: hidden;
}

/* NAVEGACIÓN PRINCIPAL */
.nav {
  display: flex;
  gap: 46px;
}

/* ITEM DE NAVEGACIÓN */
.nav-item {
  font-size: 20px;
  font-weight: 700;

  color: #9ca3af;

  text-decoration: none;
  transition: all 0.25s ease;

  position: relative;
}

/* SUBRAYADO ANIMADO */
.nav-item::after{
  content:"";
  position:absolute;
  left:0;
  bottom:-6px;
  width:0%;
  height:2px;

  background:linear-gradient(
    90deg,
    transparent,
    #e50914,
    transparent
  );

  transition:width .35s ease;
}

.nav-item:hover::after{
  width:100%;
}

/* HOVER DEL LINK */
.nav-item:hover {
  color: white;
  text-shadow: 0 0 12px rgba(229, 9, 20, 0.6);
}

/* INPUT DE BÚSQUEDA */
.search {
  width: 260px;

  background: rgba(18, 24, 38, 0.7);

  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 30px;

  padding: 10px 18px;

  color: white;
  outline: none;

  backdrop-filter: blur(10px);

  transition: all 0.35s ease;
}

/* ESTADO FOCUS DEL BUSCADOR */
.search:focus {
  border-color: #e50914;

  box-shadow:
    0 0 0 2px rgba(229, 9, 20, 0.35),
    0 0 18px rgba(229, 9, 20, 0.35),
    0 0 40px rgba(229, 9, 20, 0.25);

  animation: inputPulse 2.5s ease-in-out infinite;
}

/* ANIMACIÓN DEL RESPLANDOR */
@keyframes inputPulse {
  0% {
    box-shadow:
      0 0 0 2px rgba(229, 9, 20, 0.35),
      0 0 18px rgba(229, 9, 20, 0.35);
  }

  50% {
    box-shadow:
      0 0 0 2px rgba(229, 9, 20, 0.6),
      0 0 30px rgba(229, 9, 20, 0.6);
  }

  100% {
    box-shadow:
      0 0 0 2px rgba(229, 9, 20, 0.35),
      0 0 18px rgba(229, 9, 20, 0.35);
  }
}

/* ZONA DERECHA DEL HEADER */
.right-side {
  display: flex;
  align-items: center;
  gap: 22px;
}

/* SELECTOR DE IDIOMA */
.lang-switch {
  display: flex;

  background: rgba(18, 24, 38, 0.8);

  border-radius: 30px;

  border: 1px solid rgba(255, 255, 255, 0.08);
}

.lang-switch button {
  padding: 6px 14px;

  background: none;
  border: none;

  color: #9ca3af;

  font-weight: 700;

  cursor: pointer;
}

/* IDIOMA ACTIVO */
.lang-switch button.active {
  background: #e50914;

  color: white;

  border-radius: 30px;

  box-shadow: 0 0 12px rgba(229, 9, 20, 0.8);
}

/* ##################################################################### */
/* BOTON PARA PLEGAR-DESPLEGAR EL HEADER 
/* ##################################################################### */

.collapse-btn{
  position:absolute;

  width:44px;
  height:44px;

  right:30px;

  /* El boton mide w:44px y h:44px por lo tanto 44 / 2 = 22 *¨/
  /* Eso hace que la mitad del botón quede fuera del header y la mitad dentro, justo en el borde. */
  bottom:-22px;

  border-radius:50%;

background: linear-gradient(
  180deg,
  #0b0f19 0%,
  #111527 40%,
  #1a1320 75%,
  #2a0f14 100%
);

  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);

  border: 1px solid rgba(255,255,255,.15);

  box-shadow:
    0 8px 25px rgba(0,0,0,.6),
    inset 0 1px 0 rgba(255,255,255,.25);

  display:flex;
  align-items:center;
  justify-content:center;

  cursor:pointer;

  transition:all .35s ease;

  box-shadow:
    0 8px 25px rgba(0,0,0,.5);
  
}

/* icono */
.collapse-icon{
  width:20px;
  height:20px;

  stroke:white;
  stroke-width:2.5;
  fill:none;

  transition:transform .35s ease;
}

/* rotación */
.collapse-icon.rotated{
  transform:rotate(180deg);
}

/* hover cinematográfico */
.collapse-btn:hover{

  background:#e50914;

  box-shadow:
    0 0 12px rgba(229,9,20,.9),
    0 0 30px rgba(229,9,20,.6),
    0 10px 35px rgba(0,0,0,.6);

  transform: scale(1);
}

</style>