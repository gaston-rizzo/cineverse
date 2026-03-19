<script setup lang="ts">

// Importamos el componente del header principal de la aplicación.
// Este header contiene:
// - logo
// - navegación
// - buscador
// - selector de idioma
// Al colocarlo en App.vue se renderiza una sola vez y permanece
// visible en todas las páginas de la app.
import AppHeader from './layouts/AppHeader.vue';
import AppFooter from './layouts/AppFooter.vue';

</script>

<template>

  <!--
    Componente raíz del layout de la aplicación.

    AppHeader se renderiza fuera de RouterView para que el header
    sea persistente en todas las páginas y no se vuelva a montar
    en cada navegación.
  -->
    <div class="header-wrapper">
        <AppHeader />
    </div>
    
  <!--
    RouterView es el contenedor donde Vue Router renderiza
    dinámicamente la vista correspondiente según la ruta actual.

    Ejemplo:
    /        -> HomeView
    /movies  -> MoviesView
    /upcoming -> UpcomingView
  -->

  <!-- CONTENIDO DE PÁGINA -->
  <div class="app-content">
    <RouterView />
  </div>

  <AppFooter />

</template>

<style>

body{
  overflow-x: hidden;
}

/* VIGNETTE CINEMATOGRÁFICO GLOBAL */

.header-wrapper{
  position: sticky;
  top: 0;
  z-index: 2000;
}

.header-wrapper::after{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;

  background:
  linear-gradient(
    to right,
    rgba(0,0,0,0.98) 0%,
    rgba(0,0,0,0.85) 6%,
    rgba(0,0,0,0.55) 14%,
    transparent 28%,
    transparent 72%,
    rgba(0,0,0,0.55) 86%,
    rgba(0,0,0,0.85) 94%,
    rgba(0,0,0,0.98) 100%
  );

  z-index:1;
}

/* ==========================================================================
    VIÑETA CINEMATOGRÁFICA GLOBAL
    ========================================================================== */

/* Pseudo-elemento que crea una capa visual encima del contenido
   para oscurecer suavemente los bordes laterales de la pantalla.
   Esto genera un efecto de "viñeta cinematográfica". */

/* A diferencia de la capa ::after (que construye todo el ambiente
   cinematográfico con halos y sombras profundas), esta capa solo
   aplica un gradiente horizontal suave que oscurece los extremos
   izquierdo y derecho. */

.app-content::before{

  content:"";

  /* fixed hace que la capa quede pegada al viewport,
     no al contenedor. Así cubre siempre toda la pantalla
     incluso cuando se hace scroll. */
  position:fixed;
  /* inset:0 es equivalente a:
     top:0; right:0; bottom:0; left:0;
     Hace que la capa ocupe todo el viewport. */
  inset:0;
  /* Evita que esta capa bloquee clicks o interacciones
     con los elementos reales de la página. */
  pointer-events:none;

  /* Gradiente horizontal que oscurece los bordes de la pantalla
     y deja el centro completamente transparente.

     Esto dirige la atención visual hacia el centro
     donde está el contenido principal. */
  background:
  linear-gradient(
    to right,

    /* borde izquierdo muy oscuro */
    rgba(0,0,0,.92) 0%,

    /* transición hacia menos oscuro */
    rgba(0,0,0,.68) 6%,

    /* zona central totalmente visible */
    transparent 18%,
    transparent 82%,
  );

  /* Se coloca debajo de la capa cinematográfica principal
     (que usa z-index 1000) pero encima del contenido normal. */
  z-index:999;
}

/* ==========================================================================
   CAPA CINEMATOGRÁFICA LATERAL
   ========================================================================== */

/* Este pseudo-elemento crea todo el entorno visual de "sala de cine"
alrededor del contenido principal. */

.app-content::after{
  content:"";
  position:fixed;
  inset:0;
  pointer-events:none;

  background:

 /* ==========================================================================
   EFECTO "SALA DE CINE" EN LOS COSTADOS DE LA PANTALLA
   --------------------------------------------------------------------------
   Este bloque utiliza múltiples capas de background para simular un entorno
   cinematográfico alrededor del contenido central.

   La aplicación está diseñada con un ancho máximo de contenido de 1400px.
   Todo el espacio sobrante de la pantalla (cuando el viewport es mayor)
   se reparte entre los lados izquierdo y derecho.

   El cálculo clave es:

      calc((100vw - 1400px) / 2)

   Esto representa el ancho disponible en CADA lateral.

   Ejemplo:
   si la pantalla mide 1920px:

      (1920 - 1400) / 2 = 260px

   Resultado:
   - 260px lado izquierdo
   - 1400px contenido
   - 260px lado derecho

   Cada capa de background se posiciona dentro de ese espacio lateral
   para crear:
   - oscurecimiento profundo (paredes de la sala)
   - halo de proyector
   - línea luminosa que simula el borde de la pantalla
   ========================================================================== */

/* --------------------------------------------------------------------------
   OSCURECIMIENTO PROFUNDO IZQUIERDO
   --------------------------------------------------------------------------
   Gradiente negro que simula la oscuridad de la sala de cine.

   to right → el negro comienza fuerte en el borde de la pantalla
              y se desvanece hacia el centro del contenido.

   Posición:
      0 0 → esquina superior izquierda

   Tamaño:
      ancho  = espacio lateral izquierdo
      alto   = 100% de la pantalla
-------------------------------------------------------------------------- */
linear-gradient(
  to right,
  rgba(0,0,0,0.96),
  rgba(0,0,0,0.88),
  rgba(0,0,0,0.65),
  transparent
)
0 0 / calc((100vw - 1400px)/2) 100% no-repeat,

/* --------------------------------------------------------------------------
   OSCURECIMIENTO PROFUNDO DERECHO
   --------------------------------------------------------------------------
   Mismo efecto que el lado izquierdo pero invertido.

   to left → el gradiente comienza oscuro desde el borde derecho
             y se desvanece hacia el centro.

   Posición:
      100% 0 → esquina superior derecha
-------------------------------------------------------------------------- */
linear-gradient(
  to left,
  rgba(0,0,0,0.96),
  rgba(0,0,0,0.88),
  rgba(0,0,0,0.65),
  transparent
)
100% 0 / calc((100vw - 1400px)/2) 100% no-repeat,

/* --------------------------------------------------------------------------
   HALO DE PROYECTOR IZQUIERDO
   --------------------------------------------------------------------------
   Gradiente radial que simula la luz difusa de un proyector
   iluminando el aire de la sala.

   ellipse at left center → el foco de luz nace desde el borde izquierdo
                            en el centro vertical de la pantalla.

   El halo se desvanece gradualmente hacia el interior.
-------------------------------------------------------------------------- */
radial-gradient(
  ellipse at left center,
  rgba(255,210,120,0.35) 0%,
  rgba(255,170,60,0.18) 30%,
  rgba(255,150,40,0.08) 50%,
  transparent 70%
)
0 center / calc((100vw - 1400px)/2) 100% no-repeat,

/* --------------------------------------------------------------------------
   BORDE LUMINOSO IZQUIERDO
   --------------------------------------------------------------------------
   Línea vertical que representa el borde de la "pantalla de cine".

   Se posiciona EXACTAMENTE donde comienza el contenido central.

   Posición horizontal:
      calc((100vw - 1400px)/2)

   Esto coloca la línea justo al final del espacio lateral izquierdo.
-------------------------------------------------------------------------- */
linear-gradient(
  to bottom,
  transparent,
  rgba(255,220,150,0.7),
  transparent
)
calc((100vw - 1400px)/2) center / 2px 70% no-repeat,

/* --------------------------------------------------------------------------
   HALO DE PROYECTOR DERECHO
   --------------------------------------------------------------------------
   Mismo efecto que el halo izquierdo pero reflejado.

   ellipse at right center → el foco nace desde el borde derecho.
-------------------------------------------------------------------------- */
radial-gradient(
  ellipse at right center,
  rgba(255,210,120,0.35) 0%,
  rgba(255,170,60,0.18) 30%,
  rgba(255,150,40,0.08) 50%,
  transparent 70%
)
100% center / calc((100vw - 1400px)/2) 100% no-repeat,

/* --------------------------------------------------------------------------
   BORDE LUMINOSO DERECHO
   --------------------------------------------------------------------------
   Línea vertical que marca el final del contenido central
   en el lado derecho.

   Se calcula restando el ancho lateral izquierdo al viewport:

      calc(100vw - ((100vw - 1400px)/2))

   Esto posiciona la línea justo donde termina el contenido
   y comienza el espacio oscuro derecho.
-------------------------------------------------------------------------- */
linear-gradient(
  to bottom,
  transparent,
  rgba(255,220,150,0.7),
  transparent
)
calc(100vw - ((100vw - 1400px)/2)) center / 2px 70% no-repeat;

z-index:1000;
}

/* ==========================================================
   ULTRA DARK CINEMATIC SCROLLBAR
   ========================================================== */

/* barra más ancha */
::-webkit-scrollbar{
  width:18px;

}

/* pista */
::-webkit-scrollbar-track{
  background:#06010c;
}

/* thumb casi camuflado */
::-webkit-scrollbar-thumb{

  border-radius:14px;

  background:linear-gradient(
    180deg,
    #0b0216,
    #14042a,
    #0b0216
  );

  border:3px solid #06010c;
}

/* hover (apenas visible) */
::-webkit-scrollbar-thumb:hover{

  background:linear-gradient(
    180deg,
    #14042a,
    #1e083f,
    #14042a
  );
}

/* click */
::-webkit-scrollbar-thumb:active{

  background:linear-gradient(
    180deg,
    #1e083f,
    #2b0b5a
  );
}

html {
  overflow-anchor: none;
}

/* ==========================================================
   FIREFOX
   ========================================================== */

html{
  scrollbar-width:auto;
  scrollbar-color:#14042a #06010c;
}

body {
  background: #0b0f19;
}

</style>