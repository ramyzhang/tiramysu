import * as THREE from 'three';

import { Entity, EntityType } from "./entity.js";
import { Colours, Layers, PlayerSpawnPosition } from '../constants.js';

export class Capsule {
    radius: number = 0.5;
    lineSegment: THREE.Line3 = new THREE.Line3(new THREE.Vector3(), new THREE.Vector3(0, -1.0, 0));
}

export class Player extends Entity {    
    capsule: Capsule = new Capsule();

    constructor() {
        // use rounded box geometry for the capsule
        const cylinder = new THREE.CapsuleGeometry(0.5, 2.0, 4, 10);
        const material = new THREE.MeshLambertMaterial({ color: Colours.rose, wireframe: true });
        const mesh = new THREE.Mesh(cylinder, material);
        const aabb = new THREE.Box3().setFromObject(mesh);
        const aabbHelper = new THREE.Box3Helper(aabb, Colours.rose);

        super(mesh, EntityType.Player);
        this.attach(mesh);
        this.add(aabbHelper);
        this.position.copy(PlayerSpawnPosition);
        this.name = 'Player';
        for (const child of this.children) {
            child.layers.set(Layers.Player);
        }
    }
}