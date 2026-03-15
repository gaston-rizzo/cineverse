<script setup lang="ts">
import { ref, watch } from "vue";
import type { PaginatedResponse } from "@/types/paginated-response";
import type { Movie } from "@/types/movie";

import MovieCard from "./MovieCard.vue";

import { useI18n } from "vue-i18n";

const { t  } = useI18n({ useScope: "global" });

const props = defineProps<{
  data: PaginatedResponse<Movie> | undefined;
  isLoading: boolean;
  error: unknown;
}>();

const validMovies = ref<Movie[]>([]);

// ============================================================================
// WATCH: CUANDO CAMBIAN LOS RESULTADOS
// ============================================================================
//
// Cada vez que llega una nueva lista de películas (`props.data.results`):
// Es decir, cada vez que props.data?.results cambia:
//
// 1) Se resetea "imagesLoaded" a false para bloquear la grilla hasta que
//    las imágenes de la nueva lista estén listas.
// 2) Se filtran las películas que no tengan poster válido para evitar errores de carga.
// 3) Se llama a "preloadImages" para cargar todas las imágenes en memoria.
// 4) Cuando la precarga termina, "imagesLoaded" se pone true y se renderiza la grilla.
//
// La opción "immediate: true" permite que este watch se ejecute al montar el componente
// si ya hay data disponible, evitando que la grilla aparezca sin precargar.

watch(
  () => props.data?.results,
  async (movies) => {
    // Si no hay películas, no hacemos nada (la grilla no se renderiza)
    if (!movies?.length) {
      validMovies.value = [];
      return;
    }

    // Filtramos solo las películas que tengan poster válido
    validMovies.value = movies.filter(
      (movie) => movie.poster_path && !movie.poster_path.includes("null"),
    );
  },
  // immediate: true → ejecuta el watch inmediatamente al montar el componente
  // incluso si "props.data.results" ya tiene valor. Esto asegura que la precarga
  // de imágenes se haga desde el inicio sin esperar un cambio futuro en los props.
  { immediate: true },
);
</script>

<template>

  <div v-if="isLoading" class="cinema-loading">

    <div class="scan-line"></div>

    <div class="loading-title">
      {{ t('common.searchingMovies') }}
    </div>

    <div class="loading-bar">
      <div class="loading-progress"></div>
    </div>

  </div>

  <div v-else-if="error" class="empty-state">

    <div class="empty-visual">

      <div class="halo"></div>

      <!-- icono -->
      <svg class="film-icon" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="24" stroke="currentColor" stroke-width="2"/>
        <line x1="20" y1="20" x2="44" y2="44" stroke="currentColor" stroke-width="2"/>
        <line x1="44" y1="20" x2="20" y2="44" stroke="currentColor" stroke-width="2"/>
      </svg>

    </div>

    <h2 class="empty-title">
      {{ t("common.errorTitle") }}
    </h2>

    <p class="empty-description">
      {{ t("common.errorMessage") }}
    </p>

  </div>

  <Transition name="movie">
    
    <div v-if="validMovies.length" class="movies-grid">
      <MovieCard
        v-for="(movie, index) in validMovies"
        :key="movie.id"
        :movie="movie"
        :delay="index * 120"
      />
    </div>

    <div v-else-if="data?.results?.length === 0" class="empty-state">

      <div class="projector-flash"></div>

      <!-- film grain -->
      <div class="film-grain"></div>

      <div class="empty-visual">

        <!-- projector rays -->
        <div class="projector-rays"></div>

        <!-- halo -->
        <div class="halo"></div>
        
        <!-- icono de proyector de cine -->
        <svg class="film-icon" viewBox="0 0 64 64" fill="none">

          <!-- reels -->
          <circle cx="18" cy="18" r="8" stroke="currentColor" stroke-width="2"/>
          <circle cx="18" cy="18" r="2" fill="currentColor"/>

          <circle cx="38" cy="14" r="6" stroke="currentColor" stroke-width="2"/>
          <circle cx="38" cy="14" r="1.6" fill="currentColor"/>

          <!-- projector body -->
          <rect x="10" y="24" width="30" height="16" rx="3"
                stroke="currentColor" stroke-width="2"/>

          <!-- lens -->
          <rect x="40" y="28" width="8" height="8" rx="2"
                stroke="currentColor" stroke-width="2"/>

          <!-- tripod -->
          <line x1="20" y1="40" x2="14" y2="50"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"/>

          <line x1="30" y1="40" x2="36" y2="50"
                stroke="currentColor" stroke-width="2" stroke-linecap="round"/>

          <!-- light beam -->
          <path
            d="M48 30 L60 26 L60 38 Z"
            fill="currentColor"
            opacity="0.35"
          />

        </svg>

        <!-- particles -->
        <div class="particles">
          <span v-for="n in 14" :key="n"></span>
        </div>

      </div>

      <h2 class="empty-title">
        {{ t("common.emptyResultsTitle") }}
      </h2>

      <p class="empty-description">
        {{ t("common.emptyResultsLine1") }} <br>
        {{ t("common.emptyResultsLine2")  }}
      </p>

    </div>

  </Transition>
</template>

<style scoped>

/* ==========================================================================
   GRILLA DE PELICULAS
   --------------------------------------------------------------------------
   Grid principal donde se renderizan las tarjetas de películas.
   Se utiliza perspective para dar profundidad a animaciones 3D.
   ========================================================================== */

.movies-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
  perspective: 1000px;
}

/* ==========================================================================
   TRANSICION INICIO
   --------------------------------------------------------------------------
   Estado inicial de la animación cuando una tarjeta entra al DOM.
   Aparece desde abajo con ligera escala reducida y blur.
   ========================================================================== */

.movie-enter-from {
  opacity: 0;
  transform: translateY(80px) scale(0.92);
  filter: blur(10px);
}

/* transición utilizada durante la entrada */
.movie-enter-active {
  transition:
    transform 0.7s cubic-bezier(0.22, 0.61, 0.36, 1),
    opacity 0.6s ease,
    filter 0.6s ease;
}

/* estado final de la animación */
.movie-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}

/* ==========================================================================
   TRANSICION FINAL 
   --------------------------------------------------------------------------
   Animación simple al remover una tarjeta del DOM.
   Solo se reduce la opacidad para una salida rápida y limpia.
   ========================================================================== */

.movie-leave-from {
  opacity: 1;
}

.movie-leave-active {
  transition: opacity 0.25s ease;
}

.movie-leave-to {
  opacity: 0;
}

/* xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  
   SI NO SE ENCUENTRA LA PELICULA   
   xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx */

/* ==========================================================================
   CONTENEDOR EMPTY-STATE 
   --------------------------------------------------------------------------
   Contenedor principal que reemplaza la grilla cuando no hay resultados.
   No usamos una "card" tradicional para evitar romper la estética espacial
   cinematográfica de la UI. Todo el contenido flota sobre el fondo.
   ========================================================================== */

.empty-state{

  position:relative;

  /* ocupa todo el ancho disponible del contenedor */
  width:100%;

  /* altura mínima para mantener presencia visual */
  min-height:560px;

  /* layout vertical centrado */
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;

  /* alineación del texto */
  text-align:center;

  /* separación entre elementos */
  gap:18px;

  /* oculta elementos visuales que sobresalen (rayos, partículas) */
  overflow:hidden;

  isolation:isolate;
 
  /* eliminamos completamente la estética de "card" */
  background:transparent;
  border:none;
  box-shadow:none;
  backdrop-filter:none;

  /* animación de aparición cinematográfica */
  animation:cinematicReveal .9s cubic-bezier(.22,.61,.36,1);
}

/* ==========================================================================
   VISUAL 
   --------------------------------------------------------------------------
   Área central donde vive el icono de película, halo y rayos.
   ========================================================================== */

.empty-visual{

  position:relative;

  width:180px;
  height:180px;

  display:flex;
  align-items:center;
  justify-content:center;
}

/* ==========================================================================
   RAYOS
   --------------------------------------------------------------------------
   Rayos rotatorios que simulan luz proyectada alrededor del icono.
   ========================================================================== */

.projector-rays{

  position:absolute;

  width:300px;
  height:300px;

  background:
  conic-gradient(
    from 180deg,
    rgba(124,58,237,.35),
    transparent 20%,
    rgba(229,9,20,.25),
    transparent 45%,
    rgba(124,58,237,.35),
    transparent 70%
  );

  filter:blur(35px);

  /* rotación continua */
  animation:raysRotate 20s linear infinite;
}


/* ==========================================================================
   HALO GLOW
   --------------------------------------------------------------------------
   Halo luminoso detrás del icono para reforzar el foco visual.
   ========================================================================== */

.halo{

  position:absolute;

  width:160px;
  height:160px;

  border-radius:50%;

  background:
  radial-gradient(
    circle,
    rgba(124,58,237,.45),
    rgba(124,58,237,.15),
    transparent 70%
  );

  filter:blur(30px);

  /* respiración luminosa */
  animation:haloPulse 6s ease-in-out infinite;
}

/* ==========================================================================
   ICONO
   --------------------------------------------------------------------------
   Icono SVG que representa una cinta de película.
   ========================================================================== */

.film-icon{

  width:70px;
  height:70px;

  color:#c084fc;

  /* glow neon */
  filter:
  drop-shadow(0 0 10px rgba(124,58,237,.7))
  drop-shadow(0 0 35px rgba(229,9,20,.3));

  /* icono flotando */
  animation:iconFloat 4s ease-in-out infinite;
}

/* ==========================================================================
   TITULO 
   ========================================================================== */

.empty-title{

  font-family:"Orbitron", sans-serif;
  font-size:31px;
  font-weight:700;

  background:linear-gradient(
    90deg,
    #ffffff,
    #c084fc
  );

   background-clip:text;           /* estándar */
  -webkit-background-clip:text;   /* Chrome / Safari */
  -webkit-text-fill-color:transparent;

  letter-spacing:.3px;

  text-shadow:
    0 0 10px rgba(124,58,237,.35),
    0 0 30px rgba(124,58,237,.15);
}

/* ==========================================================================
   DESCRIPCION 
   ========================================================================== */

.empty-description{

  
  font-size:16px;
  font-weight:600;     
  color:#e2e8ff;       /* un poco más claro */
  max-width:420px;
  line-height:1.7;
  opacity:.95;
 
}

/* ==========================================================================
   PARTICLES
   --------------------------------------------------------------------------
   Pequeñas partículas flotando que refuerzan el ambiente espacial.
   ========================================================================== */

.particles span{

  position:absolute;

  width:4px;
  height:4px;

  border-radius:50%;

  opacity:.8;

  animation:particleFloat 7s linear infinite;
}

.particles span:nth-child(odd){
  background:#c084fc;
}

.particles span:nth-child(even){
  background:#ef4444;
}

/* posiciones manuales de las partículas */

.particles span:nth-child(1){top:10%;left:10%}
.particles span:nth-child(2){top:20%;left:80%}
.particles span:nth-child(3){top:60%;left:15%}
.particles span:nth-child(4){top:70%;left:75%}
.particles span:nth-child(5){top:40%;left:90%}
.particles span:nth-child(6){top:80%;left:50%}
.particles span:nth-child(7){top:30%;left:5%}
.particles span:nth-child(8){top:15%;left:65%}
.particles span:nth-child(9){top:85%;left:30%}
.particles span:nth-child(10){top:50%;left:70%}
.particles span:nth-child(11){top:75%;left:40%}
.particles span:nth-child(12){top:35%;left:25%}
.particles span:nth-child(13){top:55%;left:85%}
.particles span:nth-child(14){top:5%;left:50%}

/* ==========================================================================
   ANIMACIONES
   ========================================================================== */

/* entrada cinematográfica */

@keyframes cinematicReveal{

  from{
    opacity:0;
    transform:translateY(50px) scale(.95);
  }

  to{
    opacity:1;
    transform:translateY(0) scale(1);
  }

}

/* icono flotando */
@keyframes iconFloat{

  0%,100%{transform:translateY(0)}
  50%{transform:translateY(-10px)}

}

/* respiración del halo */
@keyframes haloPulse{

  0%,100%{
    transform:scale(1);
    opacity:.7;
  }

  50%{
    transform:scale(1.25);
    opacity:.35;
  }

}

/* movimiento vertical de partículas */
@keyframes particleFloat{

  /* nace invisible */
  0%{
    transform:translateY(10px) scale(.8);
    opacity:0;
  }

  /* fade-in suave */
  15%{
    opacity:.9;
  }

  /* parte visible flotando */
  70%{
    opacity:.9;
  }

  /* fade-out */
  100%{
    transform:translateY(-80px) scale(1);
    opacity:0;
  }

}

/* rotación de rayos */
@keyframes raysRotate{

  from{
    transform:rotate(0deg);
  }

  to{
    transform:rotate(360deg);
  }

}

/* movimiento del grano cinematográfico */
@keyframes grainMove{

  0%{transform:translate(0,0)}
  25%{transform:translate(-1px,1px)}
  50%{transform:translate(1px,-1px)}
  75%{transform:translate(-1px,-1px)}
  100%{transform:translate(1px,1px)}
}

/* xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  
   PANTALLA DE CARGA
   xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx */

/* ==========================================================================
   CONTENEDOR PRINCIPAL DEL LOADER
   Centra todo el contenido del estado "loading"
   ========================================================================== */

.cinema-loading{

  min-height:560px;            /* altura mínima del bloque de carga */
  display:flex;
  flex-direction:column;       /* elementos apilados verticalmente */
  align-items:center;          /* centrado horizontal */
  justify-content:center;      /* centrado vertical */
  gap:26px;                    /* separación entre texto y barra */
  position:relative;           /* necesario para posicionar la scan-line */

}

/* ==========================================================================
   TEXTO DEL LOADING
   Mensaje tipo sci-fi estilo interfaz futurista
   ========================================================================== */

.loading-title{

  font-family:"Orbitron", sans-serif;  /* tipografía tecnológica */
  font-size:20px;
  color:#c084fc;                     /* violeta principal del theme */
  letter-spacing:.15em;                /* espacio entre letras estilo HUD */
  text-transform:uppercase;
  /* glow suave para integrarlo con el fondo luminoso */
  text-shadow:
    0 0 12px rgba(124,58,237,.6),
    0 0 35px rgba(124,58,237,.3);

}

/* ==========================================================================
   CONTENEDOR DE LA BARRA DE CARGA
   ========================================================================== */

.loading-bar{

  width:360px;
  height:8px;
  border-radius:8px;                   /* bordes suaves */
  background:rgba(255,255,255,.06);  /* fondo de la barra de carga */
  overflow:hidden;                     /* oculta desbordes del progreso */
  /* halo luminoso para efecto futurista */
  box-shadow:
    0 0 15px rgba(124,58,237,.4);

}

/* ==========================================================================
   PROGRESO ANIMADO
   Barra que se expande y contrae mientras se mueve el gradiente
   ========================================================================== */

.loading-progress{

  height:100%;
  width:40%;                           /* valor inicial */
  /* gradiente animado tipo energía */
  background:linear-gradient(
    90deg,
    #7c3aed,
    #ef4444,
    #7c3aed
  );
  background-size:200% 100%;
  /* dos animaciones simultáneas */
  animation:
    progressMove 2.4s linear infinite,     /* movimiento del gradiente */
    progressWidth 3s ease-in-out infinite; /* expansión falsa de carga */

}

/* ==========================================================================
   LÍNEA DE ESCANEO
   Simula un escáner tipo radar o interfaz holográfica
   ========================================================================== */

.scan-line{

  position:absolute;
  width:500px;
  height:2px;
  /* brillo central con desvanecimiento lateral */
  background:linear-gradient(
    90deg,
    transparent,
    rgba(124,58,237,.9),
    transparent
  );
  animation:scanMove 3s linear infinite;

}

/* ==========================================================================
   ANIMACIONES
   ========================================================================== */

/* movimiento del gradiente dentro de la barra */
@keyframes progressMove{

  to{
    background-position:-200% 0;
  }

}

/* expansión y contracción del progreso
   simula carga mientras espera la API */
@keyframes progressWidth{

  0%{width:15%}
  50%{width:85%}
  100%{width:15%}

}

/* desplazamiento vertical de la línea de escaneo */
@keyframes scanMove{

  0%{
    transform:translateY(-120px);
    opacity:.2;
  }

  50%{
    opacity:1;
  }

  100%{
    transform:translateY(120px);
    opacity:.2;
  }

}

</style>