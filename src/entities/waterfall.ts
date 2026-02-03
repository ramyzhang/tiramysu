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
                mesh = model.clone();
            } else {
                throw new Error('Model not loaded yet');
            }
        } catch (error) {
            console.error('Failed to load tiramysu-waterfall.glb,', error);
            return;
        }

        for (const child of (mesh as THREE.Mesh).children) {
            if (child instanceof THREE.Mesh && child.name === 'Waterfall') {
                child.material = Waterfall.createWaterfallShaderMaterial();
            }
            if (child instanceof THREE.Mesh && child.name.includes('Foam')) {
                child.material = Waterfall.createFoamShaderMaterial();
            }
            if (child instanceof THREE.Mesh && child.name === 'Pond') {
                child.material = Waterfall.createPondShaderMaterial();
            }
        }

        super(mesh as THREE.Mesh, EntityType.Prop);

        this.name = 'Waterfall';
        this.static = true;
        for (const child of this.children) {
            child.layers.enable(Layers.Ignore);
        }
    }

    update(delta: number): void {
        this.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.ShaderMaterial) {
                child.material.uniforms.uTime.value += delta * 0.1;
            }
        });
    }

    private static createWaterfallShaderMaterial(): THREE.ShaderMaterial {
        const waterfallTexture = new THREE.TextureLoader().load('textures/tyier-godette-waterfall.png');
        waterfallTexture.wrapS = THREE.RepeatWrapping;
        waterfallTexture.wrapT = THREE.RepeatWrapping;

        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uTexture: { value: waterfallTexture },
                uSpeed: { value: 10.0 },
                uOpacity: { value: 1.0 },
                uColorTop: { value: new THREE.Color(Colours.lightOrange) },
                uColorBottom: { value: new THREE.Color(Colours.darkOrange) },
                uNoiseScale: { value: 5.0 },
                uNoiseStrength: { value: 0.15 },
                uGradientPower: { value: 1.5 },
                uSwayAmount: { value: 0.05 }
            },
            vertexShader: `
                uniform float uTime;
                uniform float uSwayAmount;
                
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;
              
                void main() {
                    vUv = uv;
                    
                    // Create gentle swaying motion in X-Z plane
                    // Movement increases with height (Y position) to simulate water flow
                    float heightFactor = (position.y + 1.0) * 0.5; // Normalize height factor
                    float swayX = sin(position.y * 0.5 + uTime) * uSwayAmount * heightFactor;
                    float swayZ = cos(position.y * 0.7 + uTime) * uSwayAmount * heightFactor;
                    
                    // Apply gentle movement to X and Z positions
                    vec3 newPosition = position;
                    newPosition.x += swayX;
                    newPosition.z += swayZ;
                    
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = newPosition;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
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
                    animatedUv.y += uTime * uSpeed;
                    animatedUv.y /= 10.0;
                    animatedUv = abs(mod(animatedUv, 2.0) - 1.0); // Ping-pong wrap UVs
                    
                    // Sample texture (now black and white)
                    vec4 texColor = texture2D(uTexture, animatedUv);
                    float pattern = texColor.r; // Use red channel since it's grayscale
                    
                    // Create gradient from top to bottom
                    float gradientMix = pow(1.0 - animatedUv.y, uGradientPower);
                    vec3 gradientColor = mix(uColorTop, uColorBottom, gradientMix);
                    
                    // Add noise variation
                    vec2 noiseUv = animatedUv * uNoiseScale + uTime * 0.1;
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

    private static createPondShaderMaterial(): THREE.ShaderMaterial {
        const pondTexture = new THREE.TextureLoader().load('textures/tyier-godette-foam.png');
        pondTexture.wrapS = THREE.RepeatWrapping;
        pondTexture.wrapT = THREE.RepeatWrapping;

        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uTexture: { value: pondTexture },
                uFrequency: { value: 10.0 },
                uRippleRate: { value: 50.0 },
                uAmplitude: { value: 1.0 },
                uWaveAmplitude: { value: 1.0 },
                uGradientPower: { value: 1.5 },
                uCenterPosition: { value: new THREE.Vector2(0.6, 0.35) },
                uColorTop: { value: new THREE.Color(Colours.darkOrange) },
                uColorBottom: { value: new THREE.Color(Colours.lightOrange) }
            },
            vertexShader: `
                #define PI 3.14
                
                uniform float uTime;
                uniform float uFrequency;
                uniform float uRippleRate;
                uniform float uAmplitude;
                uniform float uWaveAmplitude;
                uniform vec2 uCenterPosition;
                
                varying vec2 vUv;
                varying vec4 vFragCoord;
                
                void main() {
                    vUv = uv;
                    
                    // Calculate ripple effect similar to fragment shader
                    vec2 centerPosition = vUv - uCenterPosition;
                    float centerDistance = length(centerPosition);
                    
                    // Create ripple that dissipates near edges
                    float ripple = sin(centerDistance * -uFrequency * PI + uRippleRate * uTime) * uAmplitude / (centerDistance + 1.0);
                    float alphaScalar = (1.0 - min(centerDistance, 1.0));
                    ripple *= alphaScalar;
                    
                    // Apply ripple to Y position
                    vec3 newPosition = position;
                    newPosition.y += ripple * uWaveAmplitude * 0.01; // Scale down for vertex movement
                    
                    vec4 modelViewPosition = modelViewMatrix * vec4(newPosition, 1.0);
                    gl_Position = projectionMatrix * modelViewPosition;
                    vFragCoord = gl_Position;
                }
            `,
            fragmentShader: `
                #define PI 3.14
                
                uniform float uTime;
                uniform sampler2D uTexture;
                uniform float uFrequency;
                uniform float uRippleRate;
                uniform float uAmplitude;
                uniform float uWaveAmplitude;
                uniform float uGradientPower;
                uniform vec3 uColorTop;
                uniform vec3 uColorBottom;
                uniform vec2 uCenterPosition;
                
                varying vec2 vUv;
                varying vec4 vFragCoord;
                
                void main() {
                    vec2 centerPosition = vUv - uCenterPosition;
                    float centerDistance = length(centerPosition);
                    
                    // Create ripple that dissipates near edges
                    float ripple = sin(centerDistance * -uFrequency * PI + uRippleRate * uTime) * uAmplitude / (centerDistance + 1.0);
                    float alphaScalar = (1.0 - min(centerDistance, 1.0));
                    ripple *= alphaScalar;
                    
                    // Warp the UV
                    vec2 distortedUv = vUv;
                    if (centerDistance > 0.0) {
                        distortedUv = vUv + (centerPosition / centerDistance) * ripple * uWaveAmplitude;
                    }
                    
                    // Wrap UVs to ensure texture repeats (prevents black edges)
                    distortedUv = abs(mod(distortedUv, 2.0) - 1.0); // Ping-pong wrap
                    
                    // Sample the texture with distorted UVs
                    float pattern = texture2D(uTexture, distortedUv).r;

                    // Create gradient from top to bottom (use original UV for gradient)
                    float gradientMix = pow(1.0 - distortedUv.y, uGradientPower);
                    vec3 gradientColor = mix(uColorBottom, uColorTop, gradientMix);
                    
                    // Apply gradient only to dark parts, keep white parts white
                    // pattern = 0 (black) -> use gradient color
                    // pattern = 1 (white) -> use white
                    vec3 finalColor = mix(gradientColor, vec3(1.0), pattern);
                    
                    gl_FragColor = vec4(finalColor, 0.8);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
          });
    }

    private static createFoamShaderMaterial(): THREE.ShaderMaterial {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uWaveAmplitude: { value: 0.2 },
                uWaveFrequency: { value: 2.0 },
                uWaveSpeed: { value: 70.0 }
            },
            vertexShader: `
                uniform float uTime;
                uniform float uWaveAmplitude;
                uniform float uWaveFrequency;
                uniform float uWaveSpeed;
                
                void main() {
                    // Transform normal to world space
                    vec3 worldNormal = normalize(normalMatrix * normal);
                    
                    // Create undulation using sine and cosine waves
                    // Use different frequencies for X and Z to create organic movement
                    float waveX = sin(position.x * uWaveFrequency + uTime * uWaveSpeed);
                    float waveZ = cos(position.z * uWaveFrequency * 0.7 + uTime * uWaveSpeed * 0.5);
                    float waveY = cos(position.y * uWaveFrequency * 2.0 + uTime * uWaveSpeed);
                    
                    // Combine waves for more complex undulation
                    float undulation = (waveX + waveZ + waveY) * 0.5;
                    
                    // Displace vertex along its normal
                    vec3 newPosition = position + worldNormal * undulation * uWaveAmplitude;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                void main() {
                    gl_FragColor = vec4(1.0, 1.0, 1.0, 0.5);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
    }
}