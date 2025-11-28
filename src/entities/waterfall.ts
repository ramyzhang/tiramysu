import * as THREE from 'three';

import { Entity, EntityType } from "./entity.js";
import { Engine } from '../engine/engine.js';
import { Layers, Colours } from '../constants.js';

export class Waterfall extends Entity {
    constructor(engine: Engine) {
        let mesh: THREE.Object3D;

        try {
            const model = engine.resources.getAsset('/models/tiramysu-waterfall.glb');
            if (model) {
                mesh = model.clone().children[0];
            } else {
                throw new Error('Model not loaded yet');
            }
        } catch (error) {
            console.error('Failed to load tiramysu-waterfall.glb,', error);
            return;
        }

        (mesh as THREE.Mesh).material = Waterfall.createWaterfallShaderMaterial();

        super(mesh as THREE.Mesh, EntityType.Prop);

        this.name = 'Waterfall';
        this.static = true;
        for (const child of this.children) {
            child.layers.enable(Layers.Ignore);
        }
    }

    update(delta: number): void {
        this.children.forEach(child => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
                child.material.uniforms.uTime.value += delta * 0.1;
            }
        });
    }

    private static createWaterfallShaderMaterial(): THREE.ShaderMaterial {
        const waterfallTexture = new THREE.TextureLoader().load('textures/tyier-godette-waterfall.jpg');
        waterfallTexture.wrapS = THREE.RepeatWrapping;
        waterfallTexture.wrapT = THREE.RepeatWrapping;

        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uTexture: { value: waterfallTexture },
                uSpeed: { value: 5.0 },
                uOpacity: { value: 1.0 },
                uColorTop: { value: new THREE.Color(Colours.lightOrange) },
                uColorBottom: { value: new THREE.Color(Colours.darkOrange) },
                uNoiseScale: { value: 5.0 },
                uNoiseStrength: { value: 0.15 },
                uGradientPower: { value: 1.5 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;
              
                void main() {
                    vUv = uv;
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform sampler2D uTexture;
                uniform float uSpeed;
                uniform float uOpacity;
                uniform vec3 uColorTop;
                uniform vec3 uColorBottom;
                uniform float uNoiseScale;
                uniform float uNoiseStrength;
                uniform float uGradientPower;
                
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                // Simple noise function
                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
                }
              
                float noise(vec2 st) {
                    vec2 i = floor(st);
                    vec2 f = fract(st);
                    
                    float a = random(i);
                    float b = random(i + vec2(1.0, 0.0));
                    float c = random(i + vec2(0.0, 1.0));
                    float d = random(i + vec2(1.0, 1.0));
                    
                    vec2 u = f * f * (3.0 - 2.0 * f);
                    
                    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
                }
              
                void main() {
                    // Animate UVs downward
                    vec2 animatedUv = vUv;
                    animatedUv.y -= uTime * uSpeed;
                    animatedUv.y /= 10.0;
                    
                    // Sample texture (now black and white)
                    vec4 texColor = texture2D(uTexture, animatedUv);
                    float pattern = texColor.r; // Use red channel since it's grayscale
                    
                    // Create gradient from top to bottom
                    float gradientMix = pow(1.0 - vUv.y, uGradientPower);
                    vec3 gradientColor = mix(uColorBottom, uColorTop, gradientMix);
                    
                    // Add noise variation
                    vec2 noiseUv = vUv * uNoiseScale + uTime * 0.1;
                    float noiseValue = noise(noiseUv);
                    vec3 noiseColor = mix(vec3(1.0), vec3(noiseValue), uNoiseStrength);
                    
                    // Apply gradient only to dark parts, keep white parts white
                    // pattern = 0 (black) -> use gradient color
                    // pattern = 1 (white) -> use white
                    vec3 finalColor = mix(gradientColor * noiseColor, vec3(1.0), pattern);
                    
                    // Add foam at the top
                    float foam = smoothstep(0.7, 1.0, vUv.y) * 0.3;
                    finalColor += vec3(foam);
                    
                    // Make white parts more transparent than dark parts
                    float alpha = (1.0 - pattern * 0.5);
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
    }
}