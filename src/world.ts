import * as THREE from 'three';
import { Engine } from './engine/engine.js';
import { Colours } from './constants/colours.js';
import { Entity, EntityType } from './entities/entity.js';
import { EntityRegistry } from './entities/entity-registry.js';
import { Player } from './entities/player.js';

export class World {   
    private engine: Engine;
    private scene: THREE.Scene;
    private entityRegistry: EntityRegistry;

    constructor(_engine: Engine) {
        this.engine = _engine;
        this.scene = _engine.scene;
        this.entityRegistry = _engine.entityRegistry;
    }

    init(): void {
        this.scene.background = new THREE.Color(Colours.peach); // peach

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
        const cake = new Entity(new THREE.Mesh(geometry, material), EntityType.Prop);
        cake.mesh.rotation.x = Math.PI / 6;

        const player = new Player();
        this.entityRegistry.add(player.entity);
        
        this.entityRegistry.add(cake);

        this.engine.camera.position.z = 10; // move the camera back
    }

    update(delta: number): void {        
        this.entityRegistry.getEntities().forEach(entity => {
            // do stuff with entities
            entity.mesh.rotation.y += delta;
        });
    }
}