import * as THREE from 'three';

import { Entity, EntityType } from "./entity.js";
import { Engine } from '../engine/engine.js';
import { Layers, Colours } from '../constants.js';

export class Pond extends Entity {
    constructor(engine: Engine) {
        let mesh: THREE.Object3D;

        try {
            const model = engine.resources.getAsset('/models/tiramysu-pond.glb');
            if (model) {
                mesh = model.clone().children[0];
            } else {
                throw new Error('Model not loaded yet');
            }
        } catch (error) {
            console.error('Failed to load tiramysu-pond.glb,', error);
            return;
        }

        (mesh as THREE.Mesh).material = Pond.createPondShaderMaterial();

        super(mesh as THREE.Mesh, EntityType.Prop);

        this.name = 'Pond';
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

    private static createPondShaderMaterial(): THREE.ShaderMaterial {
        const pondTexture = new THREE.TextureLoader().load('textures/tyier-godette-foam.jpg');
        pondTexture.wrapS = THREE.RepeatWrapping;
        pondTexture.wrapT = THREE.RepeatWrapping;

        return new THREE.ShaderMaterial({
            uniforms: {
              uTime: { value: 0 },
              uTexture: { value: pondTexture },
              uFrequency: { value: 10.0 },
              uRippleRate: { value: 100.0 },
              uAmplitude: { value: 1.1 },
              uWaveAmplitude: { value: 0.5 },
              uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
              uGradientPower: { value: 1.5 },
              uColorTop: { value: new THREE.Color(Colours.darkOrange) },
              uColorBottom: { value: new THREE.Color(Colours.lightOrange) }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec4 vFragCoord;
                
                void main() {
                    vUv = uv;
                    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
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
                uniform vec2 uResolution;
                
                varying vec2 vUv;
                varying vec4 vFragCoord;
                
                void main() {
                    vec2 centerPosition = vUv - vec2(0.5, 0.2);
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
                    
                    // Sample the texture with distorted UVs
                    float pattern = texture2D(uTexture, distortedUv).r;

                    // Create gradient from top to bottom
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
}