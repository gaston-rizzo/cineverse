<script setup lang="ts">

  import { useI18n } from "vue-i18n";
  
  const { t } = useI18n();

  const year = new Date().getFullYear();

</script>

<template>
  <footer class="app-footer">

    <!-- halo superior -->
    <div class="footer-halo"></div>

    <!-- partículas -->
    <div class="footer-particles">
      <span v-for="n in 20" :key="n"></span>
    </div>

    <!-- contenido -->
    <div class="footer-container">

      <div class="footer-brand">
        CineVerse
      </div>

      <div class="footer-info">
        © {{ year }} Gastón Rizzo
      </div>

      <div class="footer-credit">
        {{ t("footer.tmdbAttribution") }}
      </div>

    </div>

  </footer>
</template>

<style scoped>
/* ==========================================================
   FOOTER CINEMATOGRÁFICO
   ========================================================== */

.app-footer{
  position:relative;
  z-index:20;

  padding:50px 20px 60px;

  text-align:center;

  background:
    radial-gradient(circle at 50% 0%, rgba(124,58,237,.25), transparent 60%),
    linear-gradient(180deg, #070b14 0%, #0b0f19 50%, #05070d 100%);

  overflow:hidden;
}

.app-footer::before{
  content:"";
  position:absolute;
  top:0;
  left:0;
  width:100%;
  height:3px;

  background:linear-gradient(
    90deg,
    transparent 0%,
    rgba(124,58,237,.6) 15%,
    rgba(229,9,20,.9) 35%,
    rgba(255,255,255,1) 50%,
    rgba(229,9,20,.9) 65%,
    rgba(124,58,237,.6) 85%,
    transparent 100%
  );

  box-shadow:
    0 0 10px rgba(229,9,20,.7),
    0 0 25px rgba(229,9,20,.5),
    0 0 50px rgba(124,58,237,.4);

  animation:footerLineGlow 4s ease-in-out infinite;
}

@keyframes footerLineGlow{
  0%,100%{
    opacity:.8;
    filter:blur(0px);
  }
  50%{
    opacity:1;
    filter:blur(1px);
  }
}

.app-footer::after{
  content:"";
  position:absolute;
  top:0;
  left:50%;
  transform:translateX(-50%);

  width:60%;
  height:40px;

  background:radial-gradient(
    ellipse at center,
    rgba(229,9,20,.35),
    rgba(124,58,237,.25),
    transparent 70%
  );

  filter:blur(25px);
  pointer-events:none;
}

/* ==========================================================
   HALO SUPERIOR (LUZ DE PROYECTOR)
   ========================================================== */

.footer-halo{
  position:absolute;
  top:-120px;
  left:50%;
  transform:translateX(-50%);

  width:600px;
  height:300px;

  background:
    radial-gradient(
      ellipse at center,
      rgba(229,9,20,.35),
      rgba(124,58,237,.25),
      transparent 70%
    );

  filter:blur(60px);

  animation:haloPulse 8s ease-in-out infinite;
}

/* ==========================================================
   PARTÍCULAS
   ========================================================== */

.footer-particles span{
  position:absolute;
  width:3px;
  height:3px;
  border-radius:50%;

  background:#c084fc;

  opacity:.6;

  animation:particleMove 10s linear infinite;
}

/* distribución random fake */
.footer-particles span:nth-child(odd){
  background:#ef4444;
}

.footer-particles span:nth-child(1){left:10%;top:20%}
.footer-particles span:nth-child(2){left:80%;top:30%}
.footer-particles span:nth-child(3){left:50%;top:10%}
.footer-particles span:nth-child(4){left:20%;top:60%}
.footer-particles span:nth-child(5){left:70%;top:70%}
.footer-particles span:nth-child(6){left:30%;top:40%}
.footer-particles span:nth-child(7){left:90%;top:50%}
.footer-particles span:nth-child(8){left:5%;top:80%}

/* ==========================================================
   CONTENIDO
   ========================================================== */

.footer-container{
  position:relative;
  z-index:2;

  max-width:1400px;
  margin:auto;

  display:flex;
  flex-direction:column;
  align-items:center;
  gap:16px;
}

/* ==========================================================
   BRAND
   ========================================================== */

.footer-brand{
  position:relative;
  font-size:26px;
  font-weight:800;
  letter-spacing:2px;
  color:white;
  overflow:hidden;
}

/* ==========================================================
   TEXTO
   ========================================================== */

.footer-info{
  font-size:14px;
  color:#cbd5f5;
  opacity:.85;
}

.footer-credit{
  font-size:12px;
  color:#94a3b8;
  opacity:.7;
}

/* ==========================================================
   ANIMACIONES
   ========================================================== */

@keyframes glowMove{
  0%{transform:translateX(-100%)}
  100%{transform:translateX(100%)}
}

@keyframes haloPulse{
  0%,100%{
    transform:translateX(-50%) scale(1);
    opacity:.6;
  }
  50%{
    transform:translateX(-50%) scale(1.2);
    opacity:.3;
  }
}

@keyframes particleMove{
  0%{
    transform:translateY(0);
    opacity:0;
  }
  20%{
    opacity:.7;
  }
  80%{
    opacity:.7;
  }
  100%{
    transform:translateY(-50px);
    opacity:0;
  }
}
</style>