import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/loaders/GLTFLoader.js";

// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000011); // Deep space color
scene.fog = new THREE.FogExp2(0x000022, 0.01); // Nebula fog

// Renderer Setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Camera Setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 10, 30);
scene.add(camera);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);

// Glowing Orb Light
const orbLight = new THREE.PointLight(0xff66ff, 2, 100); // Magenta glow
orbLight.position.set(0, 5, 0);
scene.add(orbLight);

// Orbiting Light
const orbitingLight = new THREE.PointLight(0xffffff, 1, 50);
scene.add(orbitingLight);

// Cosmic Nebula Plane
const nebulaGeometry = new THREE.PlaneGeometry(100, 100, 300, 300);
nebulaGeometry.rotateX(-Math.PI / 2);

const nebulaMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        waveHeight: { value: 1.5 },
        waveFrequency: { value: 2.0 },
        deepColor: { value: new THREE.Color(0x110033) },
        glowColor: { value: new THREE.Color(0xff44ff) },
    },
    vertexShader: `
        uniform float time;
        uniform float waveHeight;
        uniform float waveFrequency;
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            vec3 pos = position;
            pos.y += sin(pos.x * waveFrequency + time * 0.5) * waveHeight;
            pos.y += cos(pos.z * waveFrequency + time * 0.8) * waveHeight;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 deepColor;
        uniform vec3 glowColor;
        varying vec3 vPosition;
        void main() {
            float intensity = abs(sin(vPosition.y * 10.0 + 0.5));
            vec3 color = mix(deepColor, glowColor, intensity * 0.9);
            gl_FragColor = vec4(color, 1.0);
        }
    `,
    transparent: true,
});

const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
scene.add(nebula);

// Load Asteroid Model
const loader = new GLTFLoader();
let asteroid = null;
loader.load(
    "https://trystan211.github.io/ite_joash-skull/low_poly_skull.glb", // Placeholder asteroid model
    (gltf) => {
        asteroid = gltf.scene;
        asteroid.scale.set(1.5, 1.5, 1.5);
        scene.add(asteroid);
    },
    undefined,
    (error) => console.error("Error loading asteroid:", error)
);

// Star Particle System
const starCount = 8000;
const starGeometry = new THREE.BufferGeometry();
const starPositions = [];
const starVelocities = [];

for (let i = 0; i < starCount; i++) {
    const x = (Math.random() - 0.5) * 500; // Spread across a wide space
    const y = (Math.random() - 0.5) * 500;
    const z = (Math.random() - 0.5) * 500;
    starPositions.push(x, y, z);
    starVelocities.push(-0.1 - Math.random() * 0.2); // Slow downward drift
}

starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));

const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff, // Bright white color for stars
    size: 0.4, // Increased size for larger stars
    transparent: true,
    opacity: 1.0, // Fully opaque for maximum brightness
    emissive: 0xffffff, // Emits light for a glowing effect
});

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Animation Loop
const clock = new THREE.Clock();
function animate() {
    const elapsedTime = clock.getElapsedTime();

    // Update Nebula
    nebulaMaterial.uniforms.time.value = elapsedTime;

    // Update Stars
    const starPositions = stars.geometry.attributes.position.array;
    for (let i = 0; i < starCount; i++) {
        starPositions[i * 3 + 1] += starVelocities[i];
        if (starPositions[i * 3 + 1] < -250) {
            starPositions[i * 3 + 1] = 250;
        }
    }
    stars.geometry.attributes.position.needsUpdate = true;

    // Orbiting Light
    const orbitRadius = 15;
    orbitingLight.position.x = Math.sin(elapsedTime) * orbitRadius;
    orbitingLight.position.z = Math.cos(elapsedTime) * orbitRadius;
    orbitingLight.position.y = 5 + Math.sin(elapsedTime * 2);

    // Pulsating Orb Light
    orbLight.intensity = 2 + Math.sin(elapsedTime * 5) * 0.8;

    // Rotate Asteroid
    if (asteroid) {
        asteroid.rotation.y += 0.01;
        asteroid.rotation.x += 0.005;
    }

    // Render Scene
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

// Handle Resizing
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
