import * as THREE from 'three';

export class Entity extends THREE.Object3D {
    collider: THREE.Box3;
    mesh: THREE.Mesh;
    entityType: EntityType;

    constructor(mesh: THREE.Mesh, entityType: EntityType) {
        super();
        this.mesh = mesh;
        this.entityType = entityType;
        this.add(mesh);
        this.collider = new THREE.Box3().setFromObject(this.mesh);
    }
}

export enum EntityType {
    NPC,
    Player,
    Prop,
    Environment
}

