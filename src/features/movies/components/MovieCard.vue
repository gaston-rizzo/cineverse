<script setup lang="ts">

/* ============================================================================
 * MovieCard.vue
 * ============================================================================
 *
 * Este componente muestra una tarjeta interactiva que representa una película dentro de la grilla.
 * 
 * Funciones principales:
 *
 * 1. Mostrar el poster de la película con carga progresiva (skeleton hasta que la imagen carga).
 * 2. Aplicar efectos visuales avanzados al pasar el cursor:
 *    - Tilt 3D magnético que sigue la posición del cursor.
 *    - Brillo dinámico (glare) sobre el poster.
 *    - Borde animado tipo highlight cinematográfico.
 *    - Overlay con información adicional (título, año, sinopsis) y botones de acción.
 *    - Animaciones y efectos sobre botones (Ver detalles, Favorito) con rebote y pulso.
 * 3. Optimizar animaciones y renderizado con `will-change`, `transform-style: preserve-3d`
 *    y transiciones suaves.
 * 4. Mantener compatibilidad cross-browser (Firefox, Chrome, Safari).
 *
 * En resumen, es la unidad visual interactiva de la grilla de películas, con 
 * efectos estéticos y UX enfocados en profundidad, dinamismo y claridad de la información.
 */

import { ref } from "vue";

import type { Movie } from "@/features/movies/types/movie";

import { useI18n } from "vue-i18n";
  
const { t } = useI18n();

  defineProps<{
  movie: Movie;
  delay: number;
}>();

// ============================================================================
// CONTROL DE CARGA DEL POSTER
// ============================================================================
//
// Evita que el poster aparezca negro mientras la imagen se descarga.
// La imagen empieza oculta y se muestra cuando dispara el evento "load".

const imageLoaded = ref(false);

function onPosterLoad() {
  imageLoaded.value = true;
}
</script>

<template>
  <div class="movie-card" :style="{ animationDelay: delay + 'ms' }">
    <div
      class="tilt-layer"
      ref="cardRef"
    >
      <div class="poster-wrapper">
        <div class="glare"></div>

        <div v-if="!imageLoaded" class="poster-skeleton"></div>

        <img
          :src="`https://image.tmdb.org/t/p/w500${movie.poster_path}`"
          :alt="movie.title"
          class="poster"
          :class="{ loaded: imageLoaded }"
          loading="lazy"
          @load="onPosterLoad"
        />

        <!-- BARRA INFERIOR PERMANENTE -->

        <div class="title-bar">
          <div class="title-row">
            <span class="rating-badge">
              ⭐ {{ movie.vote_average?.toFixed(1) }}
            </span>

            <h3 class="movie-title">
              {{ movie.title }}
            </h3>
          </div>
        </div>

        <!-- OVERLAY HOVER -->

        <div class="poster-overlay">
          <button class="favorite-btn">♥</button>

          <div class="overlay-content">
            <h3 class="overlay-title">
              {{ movie.title }}
            </h3>

            <p class="year">
              {{ movie.release_date?.slice(0, 4) }}
            </p>

            <p class="overview">
              {{ movie.overview || t("movies.noDescription") }}
            </p>

            <button class="details-btn">{{ t("movies.viewDetails") }}</button>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* =========================================================
   CONTENEDOR PRINCIPAL DE LA TARJETA
   ---------------------------------------------------------
   Representa cada movie card dentro del grid.

    - habilita interacción con cursor
    - define transiciones suaves para transformaciones
    - activa el contexto 3D para efectos como tilt
    - optimiza el renderizado con will-change
   ========================================================= */

.movie-card {
  cursor: pointer;

  /* transiciones suaves para transformaciones y filtros */
  transition:
    transform 0.25s cubic-bezier(0.22, 0.61, 0.36, 1),
    filter 0.3s ease;

  /* permite que elementos hijos se rendericen en 3D */
  transform-style: preserve-3d;

  /* optimización para animaciones de transform */
  will-change: transform;

  /* estado inicial antes de la animación de entrada */
  opacity: 0;
  transform: translateY(30px) scale(0.96);

  /* animación de aparición de la tarjeta */
  animation: cardEnter 0.6s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
}

/* =========================================================
   ANIMACIÓN DE ENTRADA DE LA TARJETA
   ---------------------------------------------------------
   Las cards aparecen con:
    - fade-in
    - pequeño desplazamiento vertical
    - leve escala para efecto cinematográfico
   ========================================================= */

@keyframes cardEnter {
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Hace que la card flote un poco al hacer hover */
.movie-card:hover {
  transform: translateY(-4px);
}

/* =========================================================
   EFECTO HOVER SOBRE EL POSTER
   ---------------------------------------------------------
   Cuando el usuario pasa el cursor sobre la tarjeta:

    - el poster hace un leve zoom
    - se oscurece ligeramente para mejorar contraste
    - el contenido del overlay se vuelve más legible
   ========================================================= */

.movie-card:hover .poster {
  /* zoom leve del poster */
  transform: scale(1.015);
  /* oscurece la imagen para destacar texto del overlay */
  filter: brightness(0.75);
  /* asegura el orden correcto en el stacking context */
  z-index: 1;
}

/* POSTER */

/* =========================================================
   BORDE ÉPICO CINEMATOGRÁFICO (DOBLE TONO)
   ---------------------------------------------------------
   Se usa un truco con doble background:
    1) El primer fondo pinta el interior del card
    2) El segundo fondo pinta el borde con gradiente

   background-clip permite que el gradiente solo aparezca
   en el borde sin usar pseudo-elementos adicionales.
   ========================================================= */

.poster-wrapper {
  position: relative;
  aspect-ratio: 2/3;

  border-radius: 14px;
  overflow: hidden;

  isolation: isolate;

  border: 2px solid transparent;

  background:
    linear-gradient(#000, #000) padding-box,
    linear-gradient(
        var(--border-angle),
        rgba(255, 255, 255, 0.7),
        rgba(229, 9, 20, 0.9),
        rgba(255, 255, 255, 0.7)
      )
      border-box;

  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.85),
    0 8px 18px rgba(0, 0, 0, 0.65);
}

/* =========================================================
   DEFINICIÓN DE LA VARIABLE ANIMABLE --border-angle
   ---------------------------------------------------------
   Este bloque declara una variable CSS que puede animarse.
   Se usa para controlar dinámicamente el ángulo inicial de 
   gradientes. En este caso un borde animado de poster.

   Explicación de cada propiedad:
    - syntax: "<angle>" → solo acepta valores de tipo ángulo (deg, rad, turn)
    - inherits: false → la variable NO se hereda a elementos hijos
    - initial-value: 0deg → valor inicial antes de cualquier animación
   ========================================================= */

@property --border-angle {
  syntax: "<angle>";
  /* Solo acepta valores de tipo ángulo (deg, rad, turn) */
  inherits: false;
  /* No se hereda a elementos hijos */
  initial-value: 0deg;
  /* Valor inicial de la animación */
}

/* =========================================================
   ANIMACIÓN borderHighlight
   ---------------------------------------------------------
   Esta animación rota la variable CSS --border-angle de 0° a 360°.
   Se utiliza para que el gradiente conic-gradient en ::before
   del poster-wrapper parezca girar alrededor del borde, creando
   el efecto de “borde cinematográfico” animado.

   Detalles:
    - from { --border-angle: 0deg; } → valor inicial
    - to { --border-angle: 360deg; } → valor final
    - La animación se aplica normalmente con:
      animation: borderHighlight 6s linear infinite;
    - No pinta nada por sí sola; solo cambia la variable usada 
      por el gradiente
   ========================================================= */

@keyframes borderHighlight {
  from {
    --border-angle: 0deg;
  }

  to {
    --border-angle: 360deg;
  }
}

/* =========================================================
   HIGHLIGHT ANIMADO DEL BORDE DEL POSTER
   ---------------------------------------------------------
   Este pseudo-elemento ::before crea un resplandor dinámico
   sobre el borde de la tarjeta (poster-wrapper). Funciona
   con un conic-gradient animado que simula un highlight
   cinematográfico que rota alrededor del borde, sin afectar
   el contenido central del poster.

   Características:
    - Animación continua (rotación del gradiente)
    - Opacidad controlada
    - Solo visible sobre el borde mediante máscara (mask/content-box)
    - Compatible con WebKit/Safari
    - Puede invertirse la animación para tarjetas pares
   ========================================================= */

.poster-wrapper::before {
  /* Pseudo-elemento que crea el highlight animado sobre el borde del poster */
  content: "";

  /* Se posiciona absolutamente para cubrir toda la tarjeta */
  position: absolute;
  /* top:0; right:0; bottom:0; left:0; */
  inset: 0;
  
  /* Hereda el border-radius del contenedor para coincidir con esquinas redondeadas */
  border-radius: inherit;

  /* No interfiere con el hover o clicks */
  pointer-events: none;

  /* Conic-gradient que dibuja el highlight en forma de arco sobre el borde */
  background: conic-gradient(
    from var(--border-angle),
    /* Ángulo inicial animable */ transparent 0deg,
    transparent 240deg,
    /* zona invisible */ rgba(255, 255, 255, 0.95) 260deg,
    /* franja blanca intensa */ rgba(255, 255, 255, 0.5) 265deg,
    /* degradado de salida */ transparent 280deg /* final invisible */
  );

  animation: none; /* antes: borderHighlight 6s linear infinite */

  /* Animación que rota el gradiente para simular movimiento continuo */
  animation: borderHighlight 6s linear infinite;

  /* Dirección normal, puede invertirse para tarjetas pares */
  animation-direction: normal;

  /* Espacio interno para separar el highlight del contenido */
  padding: 2px;

  /* Mascara para que el highlight solo aparezca en el borde, dejando el centro limpio */
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);

  mask-composite: exclude;
  
  background-clip: border-box;

  /* Firefox fix */
  @supports (-moz-appearance: none) {
    mask-composite: subtract;
  }

  /* Compatibilidad Safari */
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);

  -webkit-mask-composite: xor;

  /* Opacidad inicial del highlight */
  opacity: 0.6;
}



/* highlight invertido para tarjetas pares */

.movie-card:nth-child(even) .poster-wrapper::before {
  animation-direction: reverse;
  animation-delay: -3s;
}

/* =========================================================
   EFECTO DE HOVER SOBRE EL BORDE ANIMADO DEL POSTER
   ---------------------------------------------------------
   Cuando el cursor pasa sobre la tarjeta (.movie-card):

   1. opacity: 1 → hace visible el pseudo-elemento ::before,
      mostrando el highlight del borde.
   2. filter: blur(.8px) brightness(1.4) → suaviza el borde
      y aumenta su brillo para un efecto más cinematográfico.
   3. transform: scale(1.02) → agranda ligeramente el pseudo-elemento
      para que el highlight se expanda y sobresalga del borde.

   Resultado: un resplandor dinámico y brillante que resalta
   la tarjeta cuando el usuario hace hover, dando sensación
   de profundidad y dramatismo.
   ========================================================= */
.movie-card:hover .poster-wrapper::before {
  opacity: 1;
  filter: blur(0.8px) brightness(1.4);
  transform: scale(1.02);
}

/* =========================================================
   EFECTO DE BRILLO CINEMÁTICO SOBRE EL POSTER
   ---------------------------------------------------------
   Este pseudo-elemento crea una franja de luz que atraviesa
   la tarjeta cuando se hace hover.

   Este bloque crea el brillo (estado inicial)

   Problema original:
   Antes el brillo se animaba solo con transform/left y,
   cuando el mouse pasaba rápido entre tarjetas, dos cards
   podían seguir animando al mismo tiempo.

   Solución aplicada:
   Se agregó control con `opacity`. Cuando el cursor sale
   de la tarjeta, el brillo desaparece inmediatamente,
   evitando que varias tarjetas muestren el efecto a la vez.
   ========================================================= */

.poster-wrapper::after {
  /* Pseudo-elemento que dibuja el brillo */
  content: "";

  /* Se posiciona encima del poster */
  position: absolute;

  /* Se expande más allá de los bordes para que el brillo
        entre y salga sin cortarse dentro del contenedor */
  inset: -40%;

  /* Gradiente que simula una franja de luz */
  background: linear-gradient(
    110deg,
    transparent 40%,
    /* zona invisible */ rgba(255, 255, 255, 0.35) 50%,
    /* centro brillante */ transparent 60% /* salida del brillo */
  );

  /* Posición inicial del brillo (fuera de la tarjeta) */
  transform: translateX(-120%) rotate(12deg);

  /* Oculto por defecto para evitar que quede visible
        cuando el cursor abandona la tarjeta */
  opacity: 0;

  /* Animaciones:
        - transform mueve la franja de luz
        - opacity controla aparición/desaparición rápida */
  transition:
    /* 1.6s - controla la velocidad del rayo */
    transform 1.6s cubic-bezier(0.22, 0.61, 0.36, 1),
    opacity 0.12s ease;

  /* Permite que el brillo no interfiera con hover o clicks */
  pointer-events: none;
}

/* =========================================================
   ACTIVACIÓN DEL BRILLO AL HACER HOVER EN LA TARJETA
   ---------------------------------------------------------

   Este bloque lo anima cuando hay hover

   Cuando el cursor entra:

   1) El brillo aparece (opacity:1)
   2) Se desplaza de izquierda a derecha atravesando el poster
   ========================================================= */

.movie-card:hover .poster-wrapper::after {
  opacity: 1;

  /* movimiento completo del brillo a través del poster */
  transform: translateX(120%) rotate(12deg);
}

/* =========================================================
   POSTER DE LA PELÍCULA
   ---------------------------------------------------------
   Imagen principal del card.
    - ocupa todo el contenedor
    - object-fit mantiene proporción del poster
    - transition permite aplicar zoom suave en hover
   ========================================================= */

.poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition:
    transform 0.35s ease,
    opacity 0.35s ease;
}

.poster.loaded {
  opacity: 1;
}

/* =========================================================
   BARRA INFERIOR DEL POSTER
   ---------------------------------------------------------
   Contenedor semitransparente donde se muestra:
    - rating
    - título de la película

   Se posiciona sobre el poster con efecto glass
   usando blur + fondo translúcido.
   ========================================================= */

.title-bar {
  position: absolute;
  bottom: 10px;
  left: 10px;
  right: 10px;

  padding: 8px 10px;

  background: rgba(20, 20, 25, 0.55);
  backdrop-filter: blur(10px);

  border-radius: 8px;

  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* =========================================================
   FILA: RATING + TÍTULO
   ---------------------------------------------------------
   Layout horizontal usando flexbox para alinear
   el badge del rating junto al título.
   ========================================================= */

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* =========================================================
   BADGE DEL RATING
   ---------------------------------------------------------
   Indicador visual del puntaje de la película.

   Características:
    - fondo degradado amarillo/dorado
    - texto oscuro para contraste
    - glow leve para resaltar el score
   ========================================================= */

.rating-badge {
  display: flex;
  align-items: center;
  gap: 4px;

  background: linear-gradient(135deg, #facc15, #f59e0b);

  color: #111;

  font-size: 11px;
  font-weight: 700;

  padding: 4px 8px;

  border-radius: 8px;

  box-shadow:
    0 4px 10px rgba(0, 0, 0, 0.45),
    0 0 10px rgba(250, 204, 21, 0.25);

  white-space: nowrap;
}

/* =========================================================
   TÍTULO DE LA PELÍCULA
   ---------------------------------------------------------
   Muestra el nombre de la película.

    - clamp a 2 líneas
    - overflow oculto para evitar romper layout
    - sombra para mejorar legibilidad sobre poster
   ========================================================= */

.movie-title {
  font-size: 14px;
  font-weight: 600;
  color: #f9fafb;
  line-height: 1.3;
  display: -webkit-box;
  /* versión estándar */
  line-clamp: 2;
  /* compatibilidad WebKit */
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.8);
}

/* =========================================================
   OVERLAY DEL POSTER (APARECE EN HOVER)
   ---------------------------------------------------------
   Capa superior que muestra:
    - título
    - año
    - sinopsis
    - botones

    Está oculta inicialmente y aparece con animación
    de fade + desplazamiento + blur.
   ========================================================= */

.poster-overlay {
  position: absolute;
  inset: 0;

  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.96) 10%,
    rgba(0, 0, 0, 0.85) 45%,
    rgba(0, 0, 0, 0.65) 70%,
    rgba(0, 0, 0, 0.35) 100%
  );

  display: flex;
  flex-direction: column;
  justify-content: flex-end;

  padding: 16px;

  opacity: 0;
  transform: translateY(12px) scale(0.98);
  filter: blur(4px);

  transition:
    opacity 0.35s ease,
    transform 0.35s cubic-bezier(0.22, 0.61, 0.36, 1),
    filter 0.35s ease;

  z-index: 3;
}

/* =========================================================
   ACTIVACIÓN DEL OVERLAY
   ---------------------------------------------------------
   Cuando el cursor entra en la tarjeta:

   - overlay se vuelve visible
   - vuelve a su posición original
   - se elimina el blur
   ========================================================= */

.movie-card:hover .poster-overlay {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}

/* =========================================================
   CONTENIDO INTERNO DEL OVERLAY
   ---------------------------------------------------------
   Contenedor del texto y botones.
   También se anima para aparecer con un pequeño
   desplazamiento vertical.
   ========================================================= */

.overlay-content {
  display: flex;
  flex-direction: column;
  gap: 6px;

  padding-bottom: 6px;

  opacity: 0;
  transform: translateY(12px);

  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}

/* aparece junto con el overlay */

.movie-card:hover .overlay-content {
  opacity: 1;
  transform: translateY(0);
}

/* =========================================================
   CAPA DE TILT 3D
   ---------------------------------------------------------
   Contenedor que recibe la transformación 3D desde JS.
   Se separa de .movie-card para no interferir con la
   animación de entrada de la tarjeta.
      
   También define las variables CSS usadas por el glare
   dinámico que sigue la posición del cursor.
   ========================================================= */

.tilt-layer {
  /* transición suave cuando el tilt vuelve a su estado normal */
  transition: transform 0.25s cubic-bezier(0.22, 0.61, 0.36, 1);

  /* mantiene el contexto 3D para los hijos */
  transform-style: preserve-3d;

  /* optimización de renderizado para animaciones de transform */
  will-change: transform;

  /* posición inicial del reflejo de luz */
  --glare-x: 50%;
  --glare-y: 50%;
}

/* =========================================================
   GLARE DINÁMICO (REFLEJO DE LUZ)
   ---------------------------------------------------------
   Capa visual que simula un reflejo sobre el poster.
      
   El centro del radial-gradient se mueve con el cursor
   usando las variables CSS:
    --glare-x
    --glare-y
   que son actualizadas desde JavaScript en mousemove.
   ========================================================= */

.glare {
  /* se posiciona sobre el poster */
  z-index: 2;

  position: absolute;
  inset: 0;

  /* evita interferir con eventos del mouse */
  pointer-events: none;

  /* gradiente radial que simula el reflejo */
  background: radial-gradient(
    circle at var(--glare-x) var(--glare-y),
    rgba(255, 255, 255, 0.35),
    rgba(255, 255, 255, 0.15) 18%,
    transparent 40%
  );

  /* mezcla la luz con el poster */
  mix-blend-mode: screen;

  /* oculto por defecto */
  opacity: 0;

  /* aparición suave del reflejo */
  transition: opacity 0.25s ease;

  /* =========================
     FIX FIREFOX
     ========================= */

  transform: translateZ(0);
  will-change: transform;
  isolation: isolate;

}

/* activa el reflejo cuando la tarjeta está en hover */

.movie-card:hover .glare {
  opacity: 1;
}

/* =========================================================
   TÍTULO EN EL OVERLAY
   ========================================================= */

.overlay-title {
  font-size: 16px;
  font-weight: 700;
  color: white;
}

/* =========================================================
   AÑO DE LANZAMIENTO
   ========================================================= */

.year {
  font-size: 12px;
  color: #9ca3af;
}

/* =========================================================
   SINOPSIS DE LA PELÍCULA
   ---------------------------------------------------------
   Texto descriptivo limitado a un máximo de líneas
   para evitar que el overlay crezca demasiado.
   ========================================================= */

.overview {
  font-size: 13px;
  color: #e5e7eb;
  line-height: 1.4;
  margin-top: 4px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  /* versión estándar */
  line-clamp: 10;
  /* compatibilidad con navegadores WebKit */  
  /* Limita la cantidad de líneas visibles del texto */
  /* se mostrará como máximo en 10 líneas. */
  -webkit-line-clamp: 10;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* =========================================================
   BOTÓN "VER DETALLES"
   ---------------------------------------------------------
   Botón principal de acción de la tarjeta.

   Se le agregan:
    - elevación al hacer hover
    - glow rojo cinematográfico
    - animación suave de interacción
  ========================================================= */

.details-btn {
  position: relative;

  margin-top: 10px;

  background: #e50914;
  color: white;

  font-size: 13px;
  font-weight: 600;

  padding: 7px 12px;

  border-radius: 6px;

  overflow: hidden;

  cursor: pointer;

  opacity: 0;
  transform: translateY(8px);

  transition:
    transform 0.25s cubic-bezier(0.22, 0.61, 0.36, 1),
    box-shadow 0.25s ease,
    background 0.2s ease,
    opacity 0.25s ease;
}

/* el botón aparece y rebota cuando se hace hover en la tarjeta */
.movie-card:hover .details-btn {
  opacity: 1;
  animation: btnBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

/* animación de rebote de entrada del botón */
@keyframes btnBounce {
  /* estado inicial (debajo y ligeramente chico) */
  0% {
    transform: translateY(12px) scale(0.95);
    opacity: 0;
  }

  /* subida principal del rebote */
  40% {
    transform: translateY(-4px) scale(1.05);
    opacity: 1;
  }

  /* primer rebote */
  65% {
    transform: translateY(2px) scale(0.99);
  }

  /* micro rebote */
  85% {
    transform: translateY(-1px) scale(1.01);
  }

  /* estado final estable */
  100% {
    transform: translateY(0) scale(1);
  }
}

/* =========================================================
   EFECTO HOVER DEL BOTÓN
   ========================================================= */

.details-btn:hover {
  background: #ff1e2d;

  box-shadow:
    0 8px 22px rgba(229, 9, 20, 0.45),
    0 0 14px rgba(229, 9, 20, 0.35);
}

/* =========================================================
   EFECTO DE LUZ DESLIZANTE SOBRE EL BOTÓN
   (similar al brillo de las tarjetas)
   ========================================================= */

.details-btn::after {
  content: "";

  position: absolute;
  inset: 0;

  background: linear-gradient(
    110deg,
    transparent 30%,
    rgba(255, 255, 255, 0.45) 50%,
    transparent 70%
  );

  transform: translateX(-140%);
  transition: transform 0.6s ease;
}

.details-btn:hover::after {
  transform: translateX(140%);
}

/* =========================================================
   BOTÓN DE FAVORITO (♥) CON EFECTO PULSO EN HOVER
   ========================================================= */

.favorite-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(20, 20, 25, 0.55);
  backdrop-filter: blur(6px);
  color: white;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s ease;
  z-index: 2;
}

.favorite-btn:hover {
  background: #ff2a5a;
  animation: heartbeat 0.7s infinite;
}

/* ========================================================================
  ANIMACIÓN LATIDO DEL BOTÓN 

  Resultado: botón circular que resalta visualmente al pasar el mouse,
  con un efecto de “latido” que simula pulsación cuando está en hover. 

  @keyframes heartbeat:

    - 0% → escala normal
    - 25% → escala 1.25 (agranda rápido)
    - 40% → vuelve a escala normal
    - 60% → escala 1.18 (pulso secundario)
    - 100% → escala normal  
/* ======================================================================== */
@keyframes heartbeat {
  0% {
    transform: scale(1);
  }

  25% {
    transform: scale(1.25);
  }

  40% {
    transform: scale(1);
  }

  60% {
    transform: scale(1.18);
  }

  100% {
    transform: scale(1);
  }
}

/* Skeleton que aparece mientras carga el poster.
   Usa un gradiente animado (shimmer) para simular carga. */
/* Skeleton = placeholder que ocupa el lugar del poster
   mientras la imagen real todavía se está cargando. */
.poster-skeleton {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  background: linear-gradient(110deg, #1a102c 25%, #5b1d55 37%, #1a102c 63%);
  background-size: 200% 100%;
  animation: skeleton 1.6s linear infinite;
}

/* Mueve el gradiente para crear el efecto de brillo en movimiento */
@keyframes skeleton {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}

/* =========================================================
   FIX FIREFOX – RECORTE DEL BORDE ANIMADO
   ---------------------------------------------------------
   Firefox tiene un bug al combinar:

      - conic-gradient animado
      - mask / mask-composite
      - overflow:hidden

   El navegador renderiza primero el gradiente completo
   y recién después aplica la máscara, lo que provoca que
   se vean "conos" o triángulos dentro del poster.

   En Chrome/Safari esto no ocurre porque aplican la máscara
   antes del render del gradiente.

   Solución aplicada:
   En Firefox se desactiva el sistema de máscara y se usa
   `clip-path` para recortar el centro del pseudo-elemento,
   dejando visible únicamente el borde.

   El resultado visual es exactamente el mismo:
      ✔ borde animado
      ✔ centro limpio
      ✔ sin artefactos visuales

   `@-moz-document url-prefix()` asegura que este bloque
   se aplique solo en Firefox, sin afectar Chrome o Safari.
   ========================================================= */

@-moz-document url-prefix() {

  .poster-wrapper::before {

    /* Desactiva completamente el sistema de máscaras
       usado por Chrome/Safari */
    mask: none;
    -webkit-mask: none;

    /* -----------------------------------------------------
       clip-path crea una "ventana" en el centro del elemento.

       El primer rectángulo define el área exterior completa.
       El segundo rectángulo define el hueco interior.

       Resultado:
       solo queda visible una franja de 2px alrededor,
       que coincide con el borde animado del poster.
       ----------------------------------------------------- */

    clip-path: polygon(
      /* contorno exterior del elemento */
      0% 0%,
      100% 0%,
      100% 100%,
      0% 100%,
      0% 0%,

      /* contorno interior (recorte del centro) */
      2px 2px,
      2px calc(100% - 2px),
      calc(100% - 2px) calc(100% - 2px),
      calc(100% - 2px) 2px,
      2px 2px
    );

  }

}
</style>