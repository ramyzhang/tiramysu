import * as THREE from 'three';

import { Colours } from '../constants.js';

export class Entity extends THREE.Object3D {
    entityType: EntityType;
    collider: THREE.Object3D | null = null;
    velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
    static: boolean = false;
    debugDirection: THREE.ArrowHelper | null = null;

    constructor(mesh: THREE.Mesh, entityType: EntityType) {
        super();
        this.copy(mesh);
        this.entityType = entityType;

        // TODO: delete when not needed
        this.debugDirection = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), this.position, 1, Colours.rose);
        this.add(this.debugDirection);
    }
}

export enum EntityType {
    NPC,
    Player,
    Prop,
    Environment
}

