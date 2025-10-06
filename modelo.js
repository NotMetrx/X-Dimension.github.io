// ===================================================
// X-DIMENSION — Scripts para Modelo de Negocio
// ===================================================

document.addEventListener('DOMContentLoaded', function() {
  // Animaciones para elementos de ingresos
  const revenueItems = document.querySelectorAll('.revenue-item');
  
  revenueItems.forEach(item => {
    item.addEventListener('mouseenter', function() {
      const estimate = this.querySelector('.revenue-estimate');
      if (estimate) {
        estimate.style.transform = 'scale(1.05)';
        estimate.style.transition = 'transform 0.3s ease';
      }
    });
    
    item.addEventListener('mouseleave', function() {
      const estimate = this.querySelector('.revenue-estimate');
      if (estimate) {
        estimate.style.transform = 'scale(1)';
      }
    });
  });

  // Efecto de contador para números (podría expandirse)
  const counters = document.querySelectorAll('.revenue-estimate');
  
  // Aquí podrías agregar animaciones de contador si los números fueran dinámicos
});

// Efecto de carga para la página
const loadingScreen = document.createElement('div');
loadingScreen.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--bg-space);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    font-family: var(--font-hud);
    color: var(--hud-accent);
    flex-direction: column;
    gap: 2rem;
`;

loadingScreen.innerHTML = `
    <div class="logo" style="font-size: 2rem; text-shadow: 0 0 20px var(--hud-accent);">X-<span>DIMENSION</span></div>
    <div style="text-align: center;">
        <div>INICIALIZANDO SISTEMAS...</div>
        <div style="margin-top: 1rem; width: 200px; height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
            <div style="width: 100%; height: 100%; background: var(--hud-accent); animation: loading 2s ease-in-out infinite;"></div>
        </div>
    </div>
`;

// Añadir estilos para la animación de carga
const style = document.createElement('style');
style.textContent = `
    @keyframes loading {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }
`;
document.head.appendChild(style);

// Mostrar pantalla de carga solo brevemente
document.body.appendChild(loadingScreen);
setTimeout(() => {
    loadingScreen.style.opacity = '0';
    loadingScreen.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
        document.body.removeChild(loadingScreen);
    }, 500);
}, 1500);

window.addEventListener("scroll", () => {
  const nav = document.querySelector(".nav-3d");
  if (window.scrollY > 50) {
    nav.classList.add("scrolled");
  } else {
    nav.classList.remove("scrolled");
  }
});
// Video Modal Functionality
document.addEventListener('DOMContentLoaded', function() {
  const videoModal = document.getElementById('video-modal');
  const watchVideoBtn = document.querySelector('.watch-video-btn');
  const closeModalBtn = document.getElementById('close-modal');
  const demoVideo = document.getElementById('demo-video');
  
  // Open modal when Watch Demo Video button is clicked
  if (watchVideoBtn) {
    watchVideoBtn.addEventListener('click', function(e) {
      e.preventDefault();
      videoModal.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    });
  }
  
  // Close modal when close button is clicked
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', function() {
      videoModal.classList.remove('active');
      if (demoVideo) demoVideo.pause(); // Pause video when closing
      document.body.style.overflow = ''; // Restore scrolling
    });
  }
  
  // Close modal when clicking outside the modal content
  if (videoModal) {
    videoModal.addEventListener('click', function(e) {
      if (e.target === videoModal) {
        videoModal.classList.remove('active');
        if (demoVideo) demoVideo.pause(); // Pause video when closing
        document.body.style.overflow = ''; // Restore scrolling
      }
    });
  }
  
  // Close modal with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && videoModal && videoModal.classList.contains('active')) {
      videoModal.classList.remove('active');
      if (demoVideo) demoVideo.pause(); // Pause video when closing
      document.body.style.overflow = ''; // Restore scrolling
    }
  });
});



// ===================================================
// 🎥 X-DIMENSION — Demo Video Modal
// ===================================================
document.addEventListener("DOMContentLoaded", () => {
  const videoModal = document.getElementById("video-modal");
  const watchVideoBtn = document.getElementById("watch-video-btn");
  const closeModalBtn = document.getElementById("close-modal");
  const demoVideo = document.getElementById("demo-video");

  if (!videoModal || !watchVideoBtn || !demoVideo) return;

  // 🟢 Abrir modal al hacer clic en el botón
  watchVideoBtn.addEventListener("click", (e) => {
    e.preventDefault();
    videoModal.style.display = "flex";
    document.body.style.overflow = "hidden"; // evitar scroll

    // Reproducir video automáticamente
    setTimeout(() => {
      demoVideo.currentTime = 0;
      demoVideo.play().catch((err) => {
        console.warn("⚠️ Autoplay bloqueado:", err);
      });
    }, 300);
  });

  // 🔴 Cerrar modal al hacer clic en el botón ✕
  closeModalBtn.addEventListener("click", closeVideoModal);

  // 🔴 Cerrar modal al hacer clic fuera del contenido
  videoModal.addEventListener("click", (e) => {
    if (e.target === videoModal) closeVideoModal();
  });

  // 🔴 Cerrar modal con tecla ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && videoModal.style.display === "flex") {
      closeVideoModal();
    }
  });

  // 🧩 Función para cerrar modal
  function closeVideoModal() {
    videoModal.style.display = "none";
    document.body.style.overflow = "auto";
    demoVideo.pause();
    demoVideo.currentTime = 0;
  }
});
