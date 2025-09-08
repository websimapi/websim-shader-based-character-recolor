import * as THREE from 'three';
import GUI from 'lil-gui';

// --- Shader Definitions ---
const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    varying vec2 vUv;
    uniform sampler2D uTexture;
    
    uniform vec3 uHairColor;
    uniform vec3 uSkinColor;
    uniform vec3 uArmorBaseColor;
    uniform vec3 uArmorTrimColor;

    // Helper function to remap a value from one range to another
    float remap(float value, float from1, float to1, float from2, float to2) {
        return (value - from1) / (to1 - from1) * (to2 - from2) + from2;
    }

    void main() {
        vec4 texColor = texture2D(uTexture, vUv);
        float gray = texColor.r; // Grayscale image, r=g=b

        // Define grayscale ranges (0-255 values normalized to 0-1)
        float armorBaseMin = 30.0 / 255.0;
        float armorBaseMax = 70.0 / 255.0;
        
        float hairMin = 80.0 / 255.0;
        float hairMax = 120.0 / 255.0;

        float skinMin = 130.0 / 255.0;
        float skinMax = 170.0 / 255.0;

        float armorTrimMin = 190.0 / 255.0;
        float armorTrimMax = 230.0 / 255.0;

        vec3 finalColor = vec3(0.0);
        float alpha = texColor.a;

        if (gray > armorBaseMin && gray < armorBaseMax) {
            float intensity = remap(gray, armorBaseMin, armorBaseMax, 0.2, 1.0);
            finalColor = uArmorBaseColor * intensity;
        } else if (gray > hairMin && gray < hairMax) {
            float intensity = remap(gray, hairMin, hairMax, 0.2, 1.0);
            finalColor = uHairColor * intensity;
        } else if (gray > skinMin && gray < skinMax) {
            float intensity = remap(gray, skinMin, skinMax, 0.2, 1.0);
            finalColor = uSkinColor * intensity;
        } else if (gray > armorTrimMin && gray < armorTrimMax) {
            float intensity = remap(gray, armorTrimMin, armorTrimMax, 0.4, 1.2);
            finalColor = uArmorTrimColor * intensity;
        } else {
            // Keep unmapped areas as original grayscale, but this shouldn't happen much
            finalColor = vec3(gray);
        }

        if (alpha < 0.1) {
            discard;
        }

        gl_FragColor = vec4(finalColor, alpha);
    }
`;

// --- Scene Setup ---
const canvas = document.getElementById('renderer-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

const scene = new THREE.Scene();

const textureLoader = new THREE.TextureLoader();
const warriorTexture = textureLoader.load('warrior_grayscale.png', (texture) => {
    // Set aspect ratio after texture loads
    const aspectRatio = texture.image.width / texture.image.height;
    const planeHeight = window.innerHeight * 0.9;
    const planeWidth = planeHeight * aspectRatio;
    
    plane.scale.set(planeWidth, planeHeight, 1);

    camera.left = -planeWidth / 2;
    camera.right = planeWidth / 2;
    camera.top = planeHeight / 2;
    camera.bottom = -planeHeight / 2;
    camera.updateProjectionMatrix();

    renderer.setSize(planeWidth, planeHeight);
});

const shaderParams = {
    colors: {
        hair: '#C0C0C0',   // Silver
        skin: '#c58c85',   // Caucasian
        armorBase: '#4a4a5c', // Dark blue/gray
        armorTrim: '#ffd700', // Gold
    }
};

const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTexture: { value: warriorTexture },
        uHairColor: { value: new THREE.Color(shaderParams.colors.hair) },
        uSkinColor: { value: new THREE.Color(shaderParams.colors.skin) },
        uArmorBaseColor: { value: new THREE.Color(shaderParams.colors.armorBase) },
        uArmorTrimColor: { value: new THREE.Color(shaderParams.colors.armorTrim) },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
});

const geometry = new THREE.PlaneGeometry(1, 1);
const plane = new THREE.Mesh(geometry, shaderMaterial);
scene.add(plane);

const camera = new THREE.OrthographicCamera(1, 1, 1, 1, 0.1, 10);
camera.position.z = 1;

// --- GUI ---
const gui = new GUI({ container: document.getElementById('gui-container') });
gui.title('Character Colors');

gui.addColor(shaderParams.colors, 'hair').name('Hair').onChange((value) => {
    shaderMaterial.uniforms.uHairColor.value.set(value);
});
gui.addColor(shaderParams.colors, 'skin').name('Skin').onChange((value) => {
    shaderMaterial.uniforms.uSkinColor.value.set(value);
});
gui.addColor(shaderParams.colors, 'armorBase').name('Armor Base').onChange((value) => {
    shaderMaterial.uniforms.uArmorBaseColor.value.set(value);
});
gui.addColor(shaderParams.colors, 'armorTrim').name('Armor Trim').onChange((value) => {
    shaderMaterial.uniforms.uArmorTrimColor.value.set(value);
});

// --- Render Loop ---
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    if (!warriorTexture.image) return;

    const aspectRatio = warriorTexture.image.width / warriorTexture.image.height;
    const planeHeight = window.innerHeight * 0.9;
    const planeWidth = planeHeight * aspectRatio;

    plane.scale.set(planeWidth, planeHeight, 1);

    camera.left = -planeWidth / 2;
    camera.right = planeWidth / 2;
    camera.top = planeHeight / 2;
    camera.bottom = -planeHeight / 2;
    camera.updateProjectionMatrix();

    renderer.setSize(planeWidth, planeHeight);
});

