// ===================================================
// X-DIMENSION — Scripts generales para todas las páginas
// ===================================================

// Navegación suave para enlaces internos
document.addEventListener('DOMContentLoaded', function() {
    // Navegación suave para enlaces de anclaje
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Solo procesar si no es un enlace a otra página
            if (href !== '#' && !href.includes('.html')) {
                e.preventDefault();
                
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Demo rápido en página principal
    const demoBtn = document.getElementById('demo-mode');
    if (demoBtn) {
        demoBtn.addEventListener('click', function() {
            // Crear notificación de transición
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.innerHTML = `
                <h3>INICIANDO MODO DEMO</h3>
                <p>Preparando simulación orbital...</p>
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                window.location.href = 'simulacion.html';
            }, 2000);
        });
    }

    // Efectos visuales para elementos interactivos
    const interactiveElements = document.querySelectorAll('.btn, .nav-links a');
    
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 5px 15px rgba(0, 240, 255, 0.3)';
        });
        
        el.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
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
});

window.addEventListener("scroll", () => {
  const nav = document.querySelector(".nav-3d");
  if (window.scrollY > 50) {
    nav.classList.add("scrolled");
  } else {
    nav.classList.remove("scrolled");
  }
});
