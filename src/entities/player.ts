import * as THREE from 'three';

import { Entity, EntityType } from "./entity.js";
import { Layers, PlayerSpawnPosition, PlayerSpawnDirection } from '../constants.js';
import { Engine } from '../engine/engine.js';
import { Capsule } from 'three/addons/math/Capsule.js';

export class Player extends Entity {    
    capsule: Capsule = new Capsule(new THREE.Vector3(), new THREE.Vector3(0, -0.6, 0), 0.15);
    weight: number = 2;

    constructor(engine: Engine) {
        // Load the player model
        let mesh: THREE.Object3D = new THREE.Mesh();

        try {
            const model = engine.resources.getAsset('/models/tiramysu-ramy.glb');
            if (model) {
                mesh = model.clone();
            } else {
                throw new Error('Model not loaded yet');
            }
        } catch (error) {
            console.error('Failed to load tiramysu-ramy.glb,', error);
        }

        super(mesh as THREE.Mesh, EntityType.Player);

        // Initialize velocity for player (required for movement)
        this.velocity = new THREE.Vector3(0, 0, 0);

        this.position.copy(PlayerSpawnPosition);

        this.name = 'Player';
        for (const child of this.children) {
            child.layers.enable(Layers.Player);
        }
        this.lookAt(PlayerSpawnPosition.clone().add(PlayerSpawnDirection));
    }
}