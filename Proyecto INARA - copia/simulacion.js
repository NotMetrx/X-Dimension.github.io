// ===================================================
// X-DIMENSION — Sistema de visión orbital (Simulación MEJORADA)
// simulacion.js v3.0 - Con Three.js y datos NASA integrados
// ===================================================

// 🎬 CONFIGURACIÓN INICIAL
const canvas = document.getElementById("scene-canvas");
const ctx = canvas.getContext("2d");
let width, height;
let stars = [];
let debris = [];
let capturedDebris = [];
let timeStart = Date.now();
let running = true;
let mouseX = 0, mouseY = 0;
let isAiming = false;
let selectedTarget = null;
let particles = [];
let explosions = [];

// ================= NASA API INTEGRATION =================
const NASA_API_KEY = 'DEMO_KEY'; // Obtén una clave gratuita en api.nasa.gov
let realDebrisData = [];
let nasaDataLoaded = false;

// Función para obtener datos reales de objetos cercanos a la Tierra
async function fetchNASADebrisData() {
    try {
        statusMsg.textContent = "OBTENIENDO DATOS NASA...";
        
        // API de objetos cercanos a la Tierra (NEO)
        const response = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=2024-01-01&end_date=2024-01-07&api_key=${NASA_API_KEY}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Procesar datos para usar en la simulación
        processNASAData(data);
        nasaDataLoaded = true;
        
    } catch (error) {
        console.error("Error obteniendo datos de la NASA:", error);
        statusMsg.textContent = "ERROR CARGANDO DATOS NASA - Usando datos de simulación";
        
        // Usar datos de ejemplo como respaldo
        useBackupNASAData();
    }
}

function processNASAData(data) {
    realDebrisData = [];
    
    // Procesar objetos cercanos a la Tierra
    for (const date in data.near_earth_objects) {
        data.near_earth_objects[date].forEach(neo => {
            if (neo.close_approach_data && neo.close_approach_data.length > 0) {
                const approach = neo.close_approach_data[0];
                
                realDebrisData.push({
                    id: neo.id,
                    name: neo.name,
                    diameter: neo.estimated_diameter?.meters?.estimated_diameter_max || 10,
                    velocity: parseFloat(approach.relative_velocity.kilometers_per_second),
                    missDistance: parseFloat(approach.miss_distance.kilometers),
                    hazardous: neo.is_potentially_hazardous_asteroid,
                    approachDate: approach.close_approach_date_full,
                    nasaUrl: neo.nasa_jpl_url
                });
            }
        });
    }
    
    // Actualizar la simulación con datos reales
    updateSimulationWithRealData();
    statusMsg.textContent = `DATOS NASA CARGADOS - ${realDebrisData.length} objetos cercanos detectados`;
    playSound(800, 0.3, 'sine');
}

function useBackupNASAData() {
    // Datos de ejemplo basados en información real de la NASA
    realDebrisData = [
        {
            id: 2000433,
            name: "433 Eros (A898 PA)",
            diameter: 16800,
            velocity: 5.27,
            missDistance: 26000000,
            hazardous: false,
            approachDate: "2024-01-15",
            nasaUrl: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=2000433"
        },
        {
            id: 2001862,
            name: "1862 Apollo",
            diameter: 1500,
            velocity: 7.1,
            missDistance: 4500000,
            hazardous: true,
            approachDate: "2024-02-20",
            nasaUrl: "https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=2001862"
        },
        {
            id: 2001915,
            name: "1915 Quetzálcoatl",
            diameter: 500,
            velocity: 8.2,
            missDistance: 12000000,
            hazardous: false,
            approachDate: "2024-03-10"
        },
        {
            id: 2002201,
            name: "2201 Oljato",
            diameter: 1800,
            velocity: 6.8,
            missDistance: 8000000,
            hazardous: true,
            approachDate: "2024-04-05"
        }
    ];
    
    updateSimulationWithRealData();
    statusMsg.textContent = `DATOS NASA DE SIMULACIÓN CARGADOS - ${realDebrisData.length} objetos detectados`;
}

function updateSimulationWithRealData() {
    // Limpiar escombros existentes
    debris = [];
    targetsList.innerHTML = '';
    
    // Crear escombros basados en datos reales
    realDebrisData.forEach((nasaObj, index) => {
        setTimeout(() => {
            const debrisObj = {
                id: nasaObj.id,
                x: 100 + Math.random() * (width - 200),
                y: 100 + Math.random() * (height - 200),
                size: Math.min(12, Math.max(3, nasaObj.diameter / 2000)), // Escalar para visualización
                vx: (Math.random() - 0.5) * (1 + nasaObj.velocity * 0.1),
                vy: (Math.random() - 0.5) * (1 + nasaObj.velocity * 0.1),
                type: {
                    color: nasaObj.hazardous ? 'rgba(255, 50, 50, 0.9)' : 'rgba(100, 150, 255, 0.9)',
                    size: Math.min(12, Math.max(3, nasaObj.diameter / 2000)),
                    danger: nasaObj.hazardous ? 0.8 + Math.random() * 0.2 : 0.2 + Math.random() * 0.3,
                    value: nasaObj.hazardous ? 600 + Math.floor(Math.random() * 200) : 200 + Math.floor(Math.random() * 100),
                    realData: nasaObj // Mantener referencia a datos reales
                },
                detectedAt: new Date(),
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * (2 + nasaObj.velocity * 0.1),
                captured: false,
                captureProgress: 0,
                isRealNASAObject: true
            };
            
            debris.push(debrisObj);
            addTargetToPanel(debrisObj);
            updateObjectCounters();
            
            // Crear versión 3D si está inicializado
            if (threeInitialized) {
                createThreeJSDebris(debrisObj);
            }
            
        }, index * 300); // Espaciar la creación para efecto visual
    });
}

// Modal para información extendida de objetos NASA
function showNASAInfoModal(debrisObj) {
    if (!debrisObj.isRealNASAObject || !debrisObj.type.realData) return;
    
    const data = debrisObj.type.realData;
    
    // Cerrar modal existente si hay uno
    const existingModal = document.querySelector('.nasa-info-modal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'nasa-info-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>${data.name}</h3>
            <div class="nasa-details">
                <p><strong>Diámetro estimado:</strong> ${Math.round(data.diameter)} metros</p>
                <p><strong>Velocidad relativa:</strong> ${data.velocity.toFixed(2)} km/s</p>
                <p><strong>Distancia de aproximación:</strong> ${Math.round(data.missDistance).toLocaleString()} km</p>
                <p><strong>Potencialmente peligroso:</strong> <span class="${data.hazardous ? 'hazard-yes' : 'hazard-no'}">${data.hazardous ? 'SÍ' : 'No'}</span></p>
                <p><strong>Próxima aproximación:</strong> ${data.approachDate || 'No disponible'}</p>
                <p><strong>ID NASA:</strong> ${data.id}</p>
            </div>
            <div class="modal-buttons">
                <button class="close-modal">Cerrar</button>
                ${data.nasaUrl ? `<a href="${data.nasaUrl}" target="_blank" class="nasa-link">Ver en NASA JPL</a>` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar modal
    modal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// ================= THREE.JS INTEGRACIÓN =================
let threeScene, threeCamera, threeRenderer, threeControls;
let debrisModels = [];
let threeInitialized = false;

function initializeThreeJS() {
    try {
        // Verificar si Three.js está disponible
        if (typeof THREE === 'undefined') {
            console.warn("Three.js no está disponible");
            return;
        }

        // Crear escena Three.js
        threeScene = new THREE.Scene();
        threeScene.background = new THREE.Color(0x000010);
        
        // Configurar cámara
        threeCamera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        threeCamera.position.set(0, 2, 5);
        
        // Configurar renderizador
        threeRenderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        threeRenderer.setSize(window.innerWidth, window.innerHeight);
        threeRenderer.domElement.style.position = 'fixed';
        threeRenderer.domElement.style.top = '0';
        threeRenderer.domElement.style.left = '0';
        threeRenderer.domElement.style.zIndex = '-1'; // Fondo
        threeRenderer.domElement.style.pointerEvents = 'none';
        document.body.appendChild(threeRenderer.domElement);
        
        // Controles de órbita (si están disponibles)
        if (typeof OrbitControls !== 'undefined') {
            threeControls = new OrbitControls(threeCamera, threeRenderer.domElement);
            threeControls.enableDamping = true;
            threeControls.dampingFactor = 0.05;
            threeControls.enabled = false; // Deshabilitado por defecto
        }
        
        // Sistema de iluminación
        const ambientLight = new THREE.AmbientLight(0x00ffff, 0.3);
        threeScene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        threeScene.add(directionalLight);
        
        // Crear escombros 3D de respaldo
        createBackupDebrisModels();
        
        // Crear Tierra o planeta de fondo
        createEarth();
        
        threeInitialized = true;
        console.log("Three.js inicializado correctamente");
        
    } catch (error) {
        console.error("Error inicializando Three.js:", error);
        threeInitialized = false;
    }
}

function createEarth() {
    const earthGeometry = new THREE.SphereGeometry(3, 32, 32);
    const earthMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a53ff,
        emissive: 0x002266,
        shininess: 5
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(0, 0, -10);
    threeScene.add(earth);
    
    // Añadir nubes
    const cloudGeometry = new THREE.SphereGeometry(3.05, 32, 32);
    const cloudMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3
    });
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    earth.add(clouds);
}

function createBackupDebrisModels() {
    // Crear geometrías simples para escombros
    const geometries = [
        new THREE.SphereGeometry(0.1, 8, 6),
        new THREE.BoxGeometry(0.15, 0.15, 0.15),
        new THREE.ConeGeometry(0.1, 0.2, 8),
        new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8),
        new THREE.OctahedronGeometry(0.12),
        new THREE.TorusGeometry(0.08, 0.03, 8, 12)
    ];
    
    const materials = [
        new THREE.MeshPhongMaterial({ color: 0xff4444, emissive: 0x220000 }),
        new THREE.MeshPhongMaterial({ color: 0xffaa00, emissive: 0x222200 }),
        new THREE.MeshPhongMaterial({ color: 0x44ff44, emissive: 0x002200 }),
        new THREE.MeshPhongMaterial({ color: 0x4444ff, emissive: 0x000022 }),
        new THREE.MeshPhongMaterial({ color: 0xff44ff, emissive: 0x220022 }),
        new THREE.MeshPhongMaterial({ color: 0x44ffff, emissive: 0x002222 })
    ];
    
    debrisModels.push(...geometries.map((geom, i) => ({
        geometry: geom,
        material: materials[i % materials.length]
    })));
}

function createThreeJSDebris(debris2D) {
    if (!threeInitialized || debrisModels.length === 0) return null;
    
    const model = debrisModels[Math.floor(Math.random() * debrisModels.length)];
    const mesh = new THREE.Mesh(model.geometry, model.material.clone());
    
    // Mapear posición 2D a 3D en una esfera alrededor de la Tierra
    const angle = Math.random() * Math.PI * 2;
    const radius = 4 + Math.random() * 2;
    const height = (Math.random() - 0.5) * 3;
    
    mesh.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius - 8
    );
    
    // Escalar según el tamaño y peligrosidad
    const scale = debris2D.size * 0.1 * (debris2D.type.danger > 0.7 ? 1.5 : 1);
    mesh.scale.setScalar(scale);
    
    // Propiedades personalizadas para sincronización
    mesh.userData = {
        debris2DId: debris2D.id,
        rotationSpeed: new THREE.Vector3(
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02
        ),
        originalScale: mesh.scale.clone(),
        orbitSpeed: (Math.random() - 0.5) * 0.001,
        orbitRadius: radius,
        orbitHeight: height,
        orbitAngle: angle
    };
    
    // Color especial para objetos NASA
    if (debris2D.isRealNASAObject) {
        mesh.material.color.set(debris2D.type.realData.hazardous ? 0xff6a00 : 0x00aaff);
        mesh.material.emissive.set(debris2D.type.realData.hazardous ? 0x331100 : 0x001133);
    }
    
    threeScene.add(mesh);
    return mesh;
}

function updateThreeJSDebris() {
    if (!threeInitialized) return;
    
    // Sincronizar escombros 2D con 3D
    debris.forEach(debris2D => {
        let threeDebris = threeScene.children.find(child => 
            child.userData && child.userData.debris2DId === debris2D.id
        );
        
        if (!threeDebris && !debris2D.captured) {
            threeDebris = createThreeJSDebris(debris2D);
        }
        
        if (threeDebris) {
            if (debris2D.captured) {
                // Efecto de captura en 3D
                threeDebris.scale.lerp(new THREE.Vector3(0, 0, 0), 0.1);
                if (threeDebris.material.opacity !== undefined) {
                    threeDebris.material.opacity = Math.max(0, threeDebris.material.opacity - 0.05);
                }
                
                if (threeDebris.scale.length() < 0.1) {
                    threeScene.remove(threeDebris);
                }
            } else {
                // Rotación continua
                threeDebris.rotation.x += threeDebris.userData.rotationSpeed.x;
                threeDebris.rotation.y += threeDebris.userData.rotationSpeed.y;
                threeDebris.rotation.z += threeDebris.userData.rotationSpeed.z;
                
                // Movimiento orbital
                threeDebris.userData.orbitAngle += threeDebris.userData.orbitSpeed;
                threeDebris.position.set(
                    Math.cos(threeDebris.userData.orbitAngle) * threeDebris.userData.orbitRadius,
                    threeDebris.userData.orbitHeight,
                    Math.sin(threeDebris.userData.orbitAngle) * threeDebris.userData.orbitRadius - 8
                );
            }
        }
    });
}

function renderThreeJS() {
    if (!threeInitialized) return;
    
    if (threeControls) {
        threeControls.update();
    }
    threeRenderer.render(threeScene, threeCamera);
}

// Sistema de partículas para efectos
function createParticle(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1.0,
            decay: Math.random() * 0.02 + 0.01,
            color: color,
            size: Math.random() * 3 + 1
        });
    }
}

function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// Referencias HUD
const telemetryTime = document.getElementById("telemetry-time");
const telemetryAlt = document.getElementById("telemetry-alt");
const telemetrySpeed = document.getElementById("telemetry-speed");
const targetsList = document.getElementById("targets-list");
const statusMsg = document.getElementById("status-msg");
const energyDisplay = document.getElementById("energy");
const netCountDisplay = document.getElementById("net-count");
const btnFilter = document.getElementById("btn-filter");
const btnScan = document.getElementById("btn-scan");

// Estado del juego
let energy = 200;
let nets = 10;
let score = 0;
let scanCooldown = 0;
let filterDangerous = false;

const missions = [
    {
        id: 1,
        title: "CAPTURA INICIAL",
        description: "Captura 3 fragmentos pequeños",
        objective: { type: 'small', count: 3 },
        reward: 500,
        completed: false
    },
    {
        id: 2,
        title: "ELIMINAR AMENAZAS",
        description: "Destruye 2 objetivos de alto riesgo",
        objective: { type: 'dangerous', count: 2 },
        reward: 1000,
        completed: false
    },
    {
        id: 3,
        title: "EFICIENCIA OPERATIVA",
        description: "Mantén >80% de eficiencia por 2 minutos",
        objective: { type: 'efficiency', duration: 120 },
        reward: 800,
        completed: false
    }
];

let currentMission = 0;
let missionProgress = { small: 0, dangerous: 0, efficiencyTime: 0 };

// ------------------ Sistema de Sonidos (Efectos) ------------------
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = 'sine') {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
        console.warn("Error reproduciendo sonido:", error);
    }
}

// ------------------ Ajustar Canvas ------------------
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    
    // Actualizar también Three.js
    if (threeInitialized) {
        threeCamera.aspect = width / height;
        threeCamera.updateProjectionMatrix();
        threeRenderer.setSize(width, height);
    }
}
window.addEventListener("resize", resize);
resize();

// ------------------ Sistema de Estrellas Mejorado ------------------
function initStars(count = 350) {
    stars = Array.from({ length: count }, () => ({
        x: Math.random() * width - width/2,
        y: Math.random() * height - height/2,
        z: Math.random() * 1000,
        speed: Math.random() * 2 + 0.5
    }));
}
initStars();

function drawStars() {
    // Fondo semi-transparente para ver Three.js detrás
    ctx.fillStyle = "rgba(0, 5, 15, 0.6)";
    ctx.fillRect(0, 0, width, height);
    
    // Nebulosas de fondo más sutiles
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
    gradient.addColorStop(0, 'rgba(0, 40, 80, 0.05)');
    gradient.addColorStop(1, 'rgba(0, 10, 30, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (let s of stars) {
        s.z -= s.speed;
        if (s.z <= 0) {
            s.z = 1000;
            s.x = Math.random() * width - width/2;
            s.y = Math.random() * height - height/2;
        }

        const k = 128.0 / s.z;
        const px = s.x * k + width / 2;
        const py = s.y * k + height / 2;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
            const size = (1 - s.z / 1000) * 3;
            const brightness = 1 - s.z / 1000;
            
            ctx.beginPath();
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.8})`;
            ctx.arc(px, py, size, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}

// ------------------ Sistema de Escombros Mejorado ------------------
function createDebris() {
    const types = [
        { color: 'rgba(250, 45, 13, 0.9)', size: 2, danger: 0.3, value: 100 },  // Fragmento pequeño
        { color: 'rgba(255, 100, 0, 0.9)', size: 4, danger: 0.6, value: 200 },  // Fragmento mediano
        { color: 'rgba(255, 0, 0, 0.9)', size: 6, danger: 0.9, value: 500 },    // Fragmento grande/peligroso
        { color: 'rgba(150, 150, 255, 0.9)', size: 3, danger: 0.2, value: 150 } // Resto de satélite
    ];
    
    const type = types[Math.floor(Math.random() * types.length)];
    
    const debris2D = {
        id: Math.floor(Math.random() * 10000),
        x: Math.random() * width,
        y: Math.random() * height,
        size: type.size,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        type: type,
        detectedAt: new Date(),
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 5,
        captured: false,
        captureProgress: 0,
        isRealNASAObject: false
    };
    
    // Crear versión 3D si está inicializado
    if (threeInitialized) {
        createThreeJSDebris(debris2D);
    }
    
    return debris2D;
}

function simulateDetection() {
    // Generar basuras si hay menos de 15 objetos, independientemente de NASA
    if (Math.random() < 0.02 && debris.length < 15) {
        const newDebris = createDebris();
        debris.push(newDebris);
        addTargetToPanel(newDebris);
        updateObjectCounters();
        playSound(800, 0.1, 'square');
    }
}

function drawDebris() {
    const debrisToRemove = [];
    
    for (let i = 0; i < debris.length; i++) {
        const d = debris[i];
        
        if (d.captured) {
            d.captureProgress += 0.02;
            if (d.captureProgress >= 1) {
                debrisToRemove.push(i);
                continue;
            }
        } else {
            // Movimiento normal
            d.x += d.vx;
            d.y += d.vy;
            d.rotation += d.rotationSpeed;
            
            // Rebote mejorado en bordes
            if (d.x < 0 || d.x > width) d.vx *= -1;
            if (d.y < 0 || d.y > height) d.vy *= -1;
        }
        
        // Dibujar escombro 2D
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rotation * Math.PI / 180);
        
        if (d.captured) {
            // Efecto de captura
            const alpha = 1 - d.captureProgress;
            ctx.fillStyle = d.type.color.replace('0.9', alpha.toString());
            
            // Efecto de contracción
            const scale = 1 - d.captureProgress * 0.5;
            ctx.scale(scale, scale);
        } else {
            ctx.fillStyle = d.type.color;
            
            // Color especial para objetos NASA
            if (d.isRealNASAObject) {
                ctx.fillStyle = d.type.realData.hazardous ? 'rgba(255, 106, 0, 0.9)' : 'rgba(0, 170, 255, 0.9)';
            }
        }
        
        // Forma más interesante que un círculo
        if (d.type.danger > 0.7 || (d.isRealNASAObject && d.type.realData.hazardous)) {
            // Forma irregular para objetos peligrosos
            ctx.beginPath();
            ctx.moveTo(0, -d.size);
            ctx.lineTo(d.size, d.size/2);
            ctx.lineTo(-d.size/2, d.size);
            ctx.lineTo(-d.size, -d.size/2);
            ctx.closePath();
            ctx.fill();
        } else {
            // Forma más regular para objetos menos peligrosos
            ctx.beginPath();
            ctx.arc(0, 0, d.size, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // Glow para objetos peligrosos
        if (d.type.danger > 0.6 || (d.isRealNASAObject && d.type.realData.hazardous)) {
            ctx.shadowColor = d.isRealNASAObject ? '#ff6a00' : 'red';
            ctx.shadowBlur = 10;
            ctx.strokeStyle = d.isRealNASAObject ? 'rgba(255, 106, 0, 0.8)' : 'rgba(255, 50, 50, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        ctx.restore();
        
        // Dibujar caja de detección si está seleccionado o es peligroso
        if (selectedTarget === d || (filterDangerous && d.type.danger > 0.5)) {
            drawDetectionBox(d);
        }
    }
    
    // Remover escombros capturados
    for (let i = debrisToRemove.length - 1; i >= 0; i--) {
        const index = debrisToRemove[i];
        capturedDebris.push(debris.splice(index, 1)[0]);
        updateObjectCounters();
    }
}

function drawDetectionBox(debris) {
    let boxColor = debris.type.danger > 0.6 ? "#ff4444" : "#1affd5";
    
    // Color especial para objetos NASA
    if (debris.isRealNASAObject) {
        boxColor = debris.type.realData.hazardous ? "#ff6a00" : "#00aaff";
    }
    
    ctx.strokeStyle = boxColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(debris.x - debris.size * 3, debris.y - debris.size * 3, debris.size * 6, debris.size * 6);
    ctx.setLineDash([]);
    
    // Información del objetivo
    ctx.fillStyle = boxColor;
    ctx.font = "12px Orbitron";
    
    if (debris.isRealNASAObject && debris.type.realData) {
        ctx.fillText(`${debris.type.realData.name}`, debris.x + debris.size + 5, debris.y - 5);
        ctx.fillText(`Vel: ${debris.type.realData.velocity.toFixed(2)} km/s`, debris.x + debris.size + 5, debris.y + 10);
    } else {
        ctx.fillText(`ID ${debris.id}`, debris.x + debris.size + 5, debris.y - 5);
        ctx.fillText(`Riesgo: ${Math.round(debris.type.danger * 100)}%`, debris.x + debris.size + 5, debris.y + 10);
    }
}

// ------------------ Panel de Objetivos Mejorado ------------------
function addTargetToPanel(obj) {
    const li = document.createElement("li");
    li.className = `target-item ${obj.type.danger > 0.6 ? 'dangerous' : ''} ${obj.isRealNASAObject ? 'nasa-object' : ''}`;
    li.dataset.id = obj.id;
    
    let nasaInfo = '';
    if (obj.isRealNASAObject && obj.type.realData) {
        const data = obj.type.realData;
        nasaInfo = `
            <span class="nasa-name">${data.name}</span>
            <span class="nasa-diameter">Ø: ${Math.round(data.diameter)}m</span>
            <span class="nasa-velocity">Vel: ${data.velocity.toFixed(2)} km/s</span>
            ${data.hazardous ? '<span class="hazard-warning">PELIGROSO</span>' : ''}
        `;
    }
    
    li.innerHTML = `
        <span class="target-id">ID ${obj.id}</span>
        ${nasaInfo}
        <span class="target-risk">Riesgo: ${Math.round(obj.type.danger * 100)}%</span>
        <span class="target-value">Valor: ${obj.type.value}</span>
    `;
    
    // Añadir tooltip con más información NASA
    if (obj.isRealNASAObject && obj.type.realData) {
        li.title = `Haz clic para más información sobre ${obj.type.realData.name}`;
    }
    
    li.addEventListener('click', () => {
        selectedTarget = obj;
        updateTargetSelection();
        // Mostrar información extendida si es objeto NASA
        if (obj.isRealNASAObject) {
            showNASAInfoModal(obj);
        }
    });
    
    targetsList.appendChild(li);
    
    const empty = targetsList.querySelector(".empty");
    if (empty) empty.remove();
}

function updateTargetPanel() {
    const items = targetsList.querySelectorAll('.target-item');
    items.forEach(item => {
        const id = parseInt(item.dataset.id);
        const target = debris.find(d => d.id === id);
        if (!target || target.captured) {
            item.style.opacity = '0.3';
            if (!item.querySelector('.captured')) {
                item.innerHTML += ' <span class="captured">CAPTURADO</span>';
            }
        }
    });
}

function updateTargetSelection() {
    const items = targetsList.querySelectorAll('.target-item');
    items.forEach(item => {
        item.classList.remove('selected');
        if (parseInt(item.dataset.id) === selectedTarget?.id) {
            item.classList.add('selected');
        }
    });
}

function filterDangerousTargets() {
    filterDangerous = !filterDangerous;
    btnFilter.setAttribute('aria-pressed', filterDangerous.toString());
    btnFilter.textContent = filterDangerous ? 'Mostrar Todos' : 'Filtrar Peligros';
    
    const items = targetsList.querySelectorAll('.target-item');
    items.forEach(item => {
        if (filterDangerous && !item.classList.contains('dangerous')) {
            item.style.display = 'none';
        } else {
            item.style.display = 'flex';
        }
    });
}

// ------------------ Sistema de Captura Mejorado ------------------
function startAiming() {
    if (nets <= 0) {
        statusMsg.textContent = "SIN MUNICIÓN DE RED - Recarga necesaria";
        playSound(200, 0.3, 'sawtooth');
        return;
    }
    
    isAiming = true;
    statusMsg.textContent = "MODO APUNTADO: Haz clic en un objetivo para capturar";
    playSound(600, 0.2, 'sine');
}

function attemptCapture(target) {
    if (!target || target.captured) return false;
    
    // Calcular probabilidad de éxito basada en tamaño y peligro
    const successChance = 0.8 - (target.type.danger * 0.3);
    const success = Math.random() < successChance;
    
    if (success) {
        // Captura exitosa
        target.captured = true;
        score += target.type.value;
        
        // Actualizar display de score
        const scoreDisplay = document.getElementById('score-display');
        if (scoreDisplay) {
            scoreDisplay.textContent = `Score: ${score}`;
        }
        
        let successMsg = `CAPTURA EXITOSA! +${target.type.value} puntos`;
        if (target.isRealNASAObject) {
            successMsg += ` - ${target.type.realData.name}`;
        }
        statusMsg.textContent = successMsg;
        playSound(1200, 0.3, 'sine');
        
        // Actualizar panel
        updateTargetPanel();
        
        // Efecto visual de captura
        createCaptureEffect(target.x, target.y);
        
        // Pequeña recuperación de energía por captura exitosa
        energy = Math.min(100, energy + 2);
        
        // Estadísticas especiales para objetos NASA
        if (target.isRealNASAObject) {
            // Bonus adicional por capturar objetos reales
            score += 100;
            energy = Math.min(100, energy + 5);
        }
    } else {
        // Fallo en la captura
        let failMsg = "FALLO EN CAPTURA - Objetivo evadido";
        if (target.isRealNASAObject) {
            failMsg += ` - ${target.type.realData.name} es demasiado rápido`;
        }
        statusMsg.textContent = failMsg;
        playSound(300, 0.5, 'sawtooth');
    }
    
    nets--;
    netCountDisplay.textContent = nets;
    updateEnergyDisplay();
    
    return success;
}

function createCaptureEffect(x, y) {
    createParticle(x, y, '#00ff00', 15);
    createParticle(x, y, '#ffff00', 8);
}

// ------------------ Sistema de Escaneo ------------------
function performScan() {
    if (scanCooldown > 0) {
        statusMsg.textContent = `Escáner en enfriamiento: ${Math.ceil(scanCooldown)}s`;
        return;
    }
    
    if (energy < 10) {
        statusMsg.textContent = "ENERGÍA INSUFICIENTE para escaneo";
        return;
    }
    
    energy -= 10;
    scanCooldown = 5; // 5 segundos de cooldown
    
    // Revelar todos los objetivos temporalmente
    debris.forEach(d => {
        if (!d.captured) {
            drawDetectionBox(d);
        }
    });
    
    // Crear efecto de onda de escaneo
    createScanWave();
    
    statusMsg.textContent = "ESCANEO COMPLETADO - Todos los objetivos revelados";
    playSound(400, 1, 'sine');
    
    // Forzar detección de varios objetivos
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            if (Math.random() < 0.7 && debris.length < 15) {
                const newDebris = createDebris();
                debris.push(newDebris);
                addTargetToPanel(newDebris);
                updateObjectCounters();
            }
        }, i * 500);
    }
}

function createScanWave() {
    let radius = 0;
    const maxRadius = Math.max(width, height);
    
    function animateWave() {
        ctx.strokeStyle = `rgba(0, 255, 255, ${1 - radius / maxRadius})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(width/2, height/2, radius, 0, 2 * Math.PI);
        ctx.stroke();
        
        radius += 10;
        if (radius < maxRadius) {
            requestAnimationFrame(animateWave);
        }
    }
    animateWave();
}

// ------------------ Sistema de Energía y Recursos ------------------
function drainEnergy(amount = 0.03) {
    if (running) {
        energy -= amount;
        if (energy < 0) {
            energy = 0;
            if (Math.random() < 0.01) {
                statusMsg.textContent = "ENERGÍA CRÍTICA - Sistemas en modo de emergencia";
                playSound(150, 0.5, 'sawtooth');
            }
        }
        updateEnergyDisplay();
    }
}

function updateEnergyDisplay() {
    energyDisplay.textContent = `${Math.max(0, Math.floor(energy))}%`;
    energyDisplay.style.color = energy > 30 ? '#1affd5' : energy > 10 ? '#ffaa00' : '#ff4444';
}

function checkResourceRefill() {
    // Recarga automática cada 30 segundos si la energía es baja
    if (energy < 20 && Math.random() < 0.001) {
        energy = Math.min(100, energy + 30);
        nets = Math.min(6, nets + 2);
        statusMsg.textContent = "SISTEMA DE RESPALDO ACTIVADO - Recursos recargados";
        playSound(800, 0.5, 'sine');
        updateEnergyDisplay();
        netCountDisplay.textContent = nets;
    }
}

// ------------------ Telemetría Mejorada ------------------
function updateTelemetry() {
    const t = Math.floor((Date.now() - timeStart) / 1000);
    const h = String(Math.floor(t / 3600)).padStart(2, "0");
    const m = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
    const s = String(t % 60).padStart(2, "0");
    telemetryTime.textContent = `T+ ${h}:${m}:${s}`;

    const alt = 400 + Math.sin(t / 20) * 150 + Math.cos(t / 45) * 80;
    const vel = 7.6 + Math.sin(t / 15) * 0.3;
    telemetryAlt.textContent = `Alt: ${alt.toFixed(1)} km`;
    telemetrySpeed.textContent = `Vel: ${vel.toFixed(2)} km/s`;
    
    // Actualizar contadores NASA
    updateObjectCounters();
    
    // Estadísticas NASA
    const nasaObjects = debris.filter(d => d.isRealNASAObject).length;
    const hazardousObjects = debris.filter(d => d.isRealNASAObject && d.type.realData.hazardous).length;
    
    // Actualizar contador NASA en telemetría
    const nasaCounter = document.getElementById('nasa-counter');
    if (nasaCounter) {
        nasaCounter.textContent = `NASA: ${nasaObjects}`;
    }
    
    const missionStatus = document.querySelector('.mission');
    if (missionStatus) {
        const efficiency = Math.round((capturedDebris.length / (capturedDebris.length + debris.length)) * 100) || 0;
        missionStatus.textContent = `Misión: LEO-Clean • NASA: ${nasaObjects} obj • Peligrosos: ${hazardousObjects} • Eficiencia: ${efficiency}%`;
    }
}

// Función para actualizar contadores
function updateObjectCounters() {
    const totalObjects = debris.length;
    const nasaObjects = debris.filter(d => d.isRealNASAObject).length;
    const simulatedObjects = totalObjects - nasaObjects;
    
    // Actualizar displays
    document.getElementById('targets-count').textContent = totalObjects;
    document.getElementById('nasa-objects').textContent = nasaObjects;
    document.getElementById('object-count').textContent = `Objects: ${totalObjects}`;
    
    // Actualizar fuente de datos
    const dataSource = document.getElementById('data-source');
    if (nasaObjects > 0) {
        dataSource.textContent = 'NASA + Simulation Data';
        dataSource.className = 'data-source nasa-active';
    } else {
        dataSource.textContent = 'Simulation Data';
        dataSource.className = 'data-source';
    }
}

// ------------------ Sistema de Interacción con Mouse ------------------
canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

canvas.addEventListener('click', (e) => {
    if (!isAiming) return;
    
    const clickX = e.clientX;
    const clickY = e.clientY;
    
    // Buscar el objetivo más cercano al click
    let closestTarget = null;
    let minDistance = 50; // Radio de detección
    
    for (const d of debris) {
        if (d.captured) continue;
        
        const distance = Math.sqrt((d.x - clickX) ** 2 + (d.y - clickY) ** 2);
        if (distance < minDistance) {
            minDistance = distance;
            closestTarget = d;
        }
    }
    
    if (closestTarget) {
        attemptCapture(closestTarget);
    } else {
        statusMsg.textContent = "OBJETIVO NO ENCONTRADO - Apunta con más precisión";
        playSound(300, 0.2, 'sawtooth');
    }
    
    isAiming = false;
});

// ------------------ Controles Mejorados ------------------
document.getElementById("btn-capture").addEventListener("click", startAiming);

document.getElementById("btn-clear").addEventListener("click", () => {
    debris = debris.filter(d => !d.captured);
    targetsList.innerHTML = '<li class="empty">Sin detecciones — escanea para encontrar objetivos</li>';
    statusMsg.textContent = "LISTA DE OBJETIVOS LIMPIADA";
    playSound(500, 0.1, 'square');
    updateObjectCounters();
    
    // Limpiar también la escena 3D
    if (threeInitialized) {
        threeScene.children = threeScene.children.filter(child => !child.userData || !child.userData.debris2DId);
    }
});

btnFilter.addEventListener("click", filterDangerousTargets);

btnScan.addEventListener("click", performScan);

// Crear botón NASA si no existe
function createNASAButton() {
    const captureControls = document.querySelector('.capture-controls');
    if (captureControls && !document.getElementById('btn-nasa-data')) {
        const nasaBtn = document.createElement('button');
        nasaBtn.id = 'btn-nasa-data';
        nasaBtn.className = 'nasa-btn';
        nasaBtn.textContent = 'Cargar Datos NASA';
        nasaBtn.title = 'Cargar datos reales de objetos cercanos a la Tierra';
        captureControls.appendChild(nasaBtn);
        
        nasaBtn.addEventListener('click', fetchNASADebrisData);
    }
}

// Teclado shortcuts
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case ' ':
        case 'c':
            e.preventDefault();
            startAiming();
            break;
        case 's':
            e.preventDefault();
            performScan();
            break;
        case 'f':
            e.preventDefault();
            filterDangerousTargets();
            break;
        case 'n': // Tecla N para datos NASA
            e.preventDefault();
            fetchNASADebrisData();
            break;
        case '1': // Cambiar a vista 3D
            if (threeInitialized && threeControls) {
                threeControls.enabled = true;
                statusMsg.textContent = "MODO 3D ACTIVADO - Usa ratón para rotar vista";
            }
            break;
        case '2': // Cambiar a vista 2D
            if (threeInitialized && threeControls) {
                threeControls.enabled = false;
                statusMsg.textContent = "MODO 2D ACTIVADO - Vista fija";
            }
            break;
        case 'r': // Reiniciar simulación
            e.preventDefault();
            restartSimulation();
            break;
    }
});

// ------------------ Bucle Principal Mejorado ------------------
function animate() {
    if (running) {
        // Renderizar Three.js (fondo)
        renderThreeJS();
        
        // Luego renderizar elementos 2D
        drawStars();
        drawDebris();
        drawParticles();
        
        // Generar detecciones aleatorias
        simulateDetection();
        
        updateTelemetry();
        drainEnergy();
        
        // Actualizar escombros 3D
        updateThreeJSDebris();
        
        // Actualizar cooldowns
        if (scanCooldown > 0) {
            scanCooldown -= 1/60; // 60 FPS
        }
        
        checkResourceRefill();
        
        // Dibujar retícula de apuntado si está en modo aiming
        if (isAiming) {
            drawAimingReticle();
        }
    }
    requestAnimationFrame(animate);
}

function drawAimingReticle() {
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 30, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Cruz de puntería
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mouseX - 20, mouseY);
    ctx.lineTo(mouseX + 20, mouseY);
    ctx.moveTo(mouseX, mouseY - 20);
    ctx.lineTo(mouseX, mouseY + 20);
    ctx.stroke();
}

// ------------------ Inicialización ------------------
window.addEventListener('load', function() {
    console.log("Página cargada, iniciando simulación...");
    
    // Inicializar Three.js primero
    initializeThreeJS();
    
    // Crear botón NASA
    createNASAButton();
    
    statusMsg.textContent = "SIMULACIÓN ORBITAL INICIADA - Usa [C] para capturar, [S] para escanear, [N] para datos NASA";
    timeStart = Date.now();
    
    // Forzar la eliminación de la pantalla de carga
    removeLoadingScreen();
    
    // Asegurar que el HUD sea visible
    const hud = document.getElementById('hud');
    if (hud) {
        hud.style.display = 'block';
    }
    
    // Iniciar con algunos objetivos de simulación
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const newDebris = createDebris();
            debris.push(newDebris);
            addTargetToPanel(newDebris);
            updateObjectCounters();
        }, i * 1000);
    }
    
    // Cargar datos NASA después de un breve retraso
    setTimeout(() => {
        fetchNASADebrisData();
    }, 2000);
    
    // Iniciar animación
    animate();
    
    // Instrucciones iniciales
    setTimeout(() => {
        statusMsg.textContent = "PRESIONA [C] O EL BOTÓN CAPTURAR PARA COMENZAR - [N] para datos NASA en tiempo real";
    }, 3000);
});

// Función para eliminar la pantalla de carga de forma segura
function removeLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const manualLoadingScreen = document.querySelector('div[style*="position: fixed"][style*="loading"]');
    
    if (loadingScreen) {
        console.log("Eliminando pantalla de carga por ID...");
        loadingScreen.style.opacity = '0';
        loadingScreen.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            if (document.body.contains(loadingScreen)) {
                document.body.removeChild(loadingScreen);
                console.log("Pantalla de carga eliminada por ID");
            }
        }, 500);
    }
    
    if (manualLoadingScreen) {
        console.log("Eliminando pantalla de carga manual...");
        manualLoadingScreen.style.opacity = '0';
        manualLoadingScreen.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            if (document.body.contains(manualLoadingScreen)) {
                document.body.removeChild(manualLoadingScreen);
                console.log("Pantalla de carga manual eliminada");
            }
        }, 500);
    }
    
    // Asegurarse de que el HUD sea visible
    const hud = document.getElementById('hud');
    if (hud) {
        hud.style.display = 'block';
    }
    
    // Habilitar interacción
    document.body.style.pointerEvents = 'auto';
}

// Añadir función para reiniciar simulación si está detenida
function restartSimulation() {
    if (!running) {
        running = true;
        timeStart = Date.now();
        statusMsg.textContent = "SIMULACIÓN REANUDADA";
        animate();
    }
}

// ==================== SISTEMA "CÓMO FUNCIONA" ====================

// Mostrar modal de cómo funciona
function showHowItWorksModal() {
    const modal = document.getElementById('how-it-works-modal');
    if (modal) {
        modal.style.display = 'flex';
        // Cerrar instrucciones si están abiertas
        const instructionsModal = document.getElementById('instructions-modal');
        if (instructionsModal) {
            instructionsModal.style.display = 'none';
        }
    }
}

// Cerrar modal de cómo funciona
function closeHowItWorksModal() {
    const modal = document.getElementById('how-it-works-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Mostrar modal de instrucciones
function showInstructionsModal() {
    const modal = document.getElementById('instructions-modal');
    if (modal) {
        modal.style.display = 'flex';
        // Cerrar cómo funciona si está abierto
        const howItWorksModal = document.getElementById('how-it-works-modal');
        if (howItWorksModal) {
            howItWorksModal.style.display = 'none';
        }
    }
}

// Inicializar botones de información
function initInfoButtons() {
    const helpButton = document.getElementById('help-button');
    const howItWorksButton = document.getElementById('how-it-works-button');
    const closeInstructions = document.getElementById('close-instructions');
    const closeHowItWorksBtn = document.getElementById('close-how-it-works');
    const startPlaying = document.getElementById('start-playing');
    const showInstructionsFromHow = document.getElementById('show-instructions-from-how');
    
    if (helpButton) {
        helpButton.addEventListener('click', showInstructionsModal);
    }
    
    if (howItWorksButton) {
        howItWorksButton.addEventListener('click', showHowItWorksModal);
    }
    
    if (closeInstructions) {
        closeInstructions.addEventListener('click', () => {
            const instructionsModal = document.getElementById('instructions-modal');
            if (instructionsModal) {
                instructionsModal.style.display = 'none';
            }
        });
    }
    
    if (closeHowItWorksBtn) {
        closeHowItWorksBtn.addEventListener('click', closeHowItWorksModal);
    }
    
    if (startPlaying) {
        startPlaying.addEventListener('click', () => {
            const instructionsModal = document.getElementById('instructions-modal');
            if (instructionsModal) {
                instructionsModal.style.display = 'none';
            }
        });
    }
    
    if (showInstructionsFromHow) {
        showInstructionsFromHow.addEventListener('click', () => {
            closeHowItWorksModal();
            showInstructionsModal();
        });
    }
    
    // Cerrar modales al hacer clic fuera
    const modals = document.querySelectorAll('.instructions-modal, .nasa-info-modal');
    modals.forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    });
}

// Agregar atajo de teclado
document.addEventListener('keydown', (e) => {
    if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        showHowItWorksModal();
    }
    if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        showInstructionsModal();
    }
});

// Inicializar cuando se cargue la página
window.addEventListener('load', function() {
    // Inicializar botones de información
    setTimeout(initInfoButtons, 1000);
});