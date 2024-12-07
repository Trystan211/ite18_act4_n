import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/OrbitControls.js";

// === Basic Scene Setup ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 15);
scene.add(camera);

// === Controls ===
new OrbitControls(camera, renderer.domElement);

// === Lighting ===
const ambientLight = new THREE.AmbientLight(0x8888ff, 0.5); // Cool ambient light
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 2, 50);
pointLight.position.set(0, 10, 0);
scene.add(pointLight);

// === Crystal Floor ===
const crystalFloor = (() => {
    const geometry = new THREE.PlaneGeometry(100, 100, 300, 300);
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            color1: { value: new THREE.Color(0x6a0dad) }, // Deep purple
            color2: { value: new THREE.Color(0x8a2be2) }, // Vivid purple
        },
        vertexShader: `
            uniform float time;
            varying vec2 vUv;

            void main() {
                vUv = uv;
                vec3 pos = position;
                pos.y += sin(pos.x * 0.8 + time) * 0.5;
                pos.y += cos(pos.z * 1.2 + time) * 0.5;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 color1;
            uniform vec3 color2;
            varying vec2 vUv;

            void main() {
                float blend = sin(vUv.y * 10.0 + vUv.x * 10.0) * 0.5 + 0.5;
                vec3 color = mix(color1, color2, blend);
                gl_FragColor = vec4(color, 1.0);
            }
        `,
    });

    return new THREE.Mesh(geometry, material);
})();
scene.add(crystalFloor);

// === Floating Crystal Shards ===
const crystalShards = (() => {
    const group = new THREE.Group();

    const shardGeometry = new THREE.ConeGeometry(0.2, 1, 4);
    const shardMaterial = new THREE.MeshStandardMaterial({
        color: 0x87ceeb,
        emissive: 0x1e90ff,
        roughness: 0.2,
        metalness: 0.8,
    });

    for (let i = 0; i < 50; i++) {
        const shard = new THREE.Mesh(shardGeometry, shardMaterial);
        shard.position.set(
            (Math.random() - 0.5) * 30,
            Math.random() * 10,
            (Math.random() - 0.5) * 30
        );
        shard.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        shard.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02
        );
        group.add(shard);
    }

    return group;
})();
scene.add(crystalShards);

// === Skybox Glow ===
const skybox = (() => {
    const geometry = new THREE.SphereGeometry(100, 32, 32);
    const material = new THREE.ShaderMaterial({
        uniforms: {
            innerColor: { value: new THREE.Color(0x000080) }, // Deep blue
            outerColor: { value: new THREE.Color(0x1e90ff) }, // Light blue
        },
        vertexShader: `
            varying vec3 vWorldPosition;
            void main() {
                vWorldPosition = normalize(position);
                gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 innerColor;
            uniform vec3 outerColor;
            varying vec3 vWorldPosition;
            void main() {
                float intensity = dot(vWorldPosition, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
                gl_FragColor = vec4(mix(innerColor, outerColor, intensity), 1.0);
            }
        `,
        side: THREE.BackSide,
    });

    return new THREE.Mesh(geometry, material);
})();
scene.add(skybox);

// === Animation ===
const clock = new THREE.Clock();

function animate() {
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    // Update crystal floor animation
    crystalFloor.material.uniforms.time.value = time;

    // Update floating shards
    crystalShards.children.forEach((shard) => {
        shard.position.add(shard.userData.velocity);
        shard.rotation.x += delta * 0.5;
        shard.rotation.y += delta * 0.5;

        // Wrap shard positions
        if (shard.position.y > 10) shard.position.y = -10;
        if (shard.position.y < -10) shard.position.y = 10;
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

// === Responsive Resize ===
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
