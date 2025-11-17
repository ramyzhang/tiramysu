import * as THREE from 'three';

import { Entity, EntityType } from "./entity.js";
import { Colours, Layers, PlayerSpawnPosition, PlayerSpawnDirection } from '../constants.js';
import { Engine } from '../engine/engine.js';

export class Capsule {
    radius: number = 0.25;
    lineSegment: THREE.Line3 = new THREE.Line3(new THREE.Vector3(), new THREE.Vector3(0, -0.5, 0));
}

export class Player extends Entity {    
    capsule: Capsule = new Capsule();

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
        this.attach(mesh);

        // const cylinder = new THREE.CapsuleGeometry(this.capsule.radius, this.capsule.lineSegment.distance(), 4, 10);
        // const material = new THREE.MeshLambertMaterial({ color: Colours.rose, wireframe: true });
        // this.add(new THREE.Mesh(cylinder, material));

        this.position.copy(PlayerSpawnPosition);

        this.name = 'Player';
        for (const child of this.children) {
            child.layers.set(Layers.Player);
        }
        this.lookAt(PlayerSpawnPosition.add(PlayerSpawnDirection));
    }
}