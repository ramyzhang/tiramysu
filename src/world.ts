import * as THREE from 'three';
import { Engine } from './engine/engine.js';
import { Colours } from './objects/colours.js';

export class World {   
    private engine: Engine;

    private cake: THREE.Mesh | undefined;  

    constructor(engine: Engine) {
        this.engine = engine;
    }

    init(): void {
        this.engine.scene.background = new THREE.Color(Colours.peach); // peach

        // -------------- make a cake --------------
        const textureLoader = new THREE.TextureLoader();
        const textureIcing = textureLoader.load('/textures/cake-icing.png');
        const textureSides = textureLoader.load('/textures/cake-sides.png');
        const textureBottom = textureLoader.load('/textures/cake-bottom.png');
        
        const geometry = new THREE.BoxGeometry(3, 1, 3);
        const material = [
            new THREE.MeshBasicMaterial({ map: textureSides }), // right
            new THREE.MeshBasicMaterial({ map: textureSides }), // left
            new THREE.MeshBasicMaterial({ map: textureIcing }), // top
            new THREE.MeshBasicMaterial({ map: textureBottom }), // bottom
            new THREE.MeshBasicMaterial({ map: textureSides }), // front
            new THREE.MeshBasicMaterial({ map: textureSides }) // back
        ];
        this.cake = new THREE.Mesh(geometry, material);
        this.cake.rotation.x = Math.PI / 6;
        
        this.engine.scene.add(this.cake);
        this.engine.camera.position.z = 5;
        
        // some ambient lighting!
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.engine.scene.add(ambientLight);
    }

    update(delta: number): void {        
        if (this.cake) {
            this.cake.rotation.y += delta;
        }
    }
}