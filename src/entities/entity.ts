import * as THREE from 'three';

export class Entity extends THREE.Object3D {
    entityType: EntityType;
    collider: THREE.Object3D | null = null;
    velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
    static: boolean = false;

    constructor(mesh: THREE.Mesh, entityType: EntityType) {
        super();
        this.copy(mesh);
        this.entityType = entityType;
    }
}

export enum EntityType {
    NPC,
    Player,
    Prop,
    Environment
}

