import * as THREE from 'three';

export class Entity extends THREE.Object3D {
    entityType: EntityType;
    // Optional properties - only used by specific entity types
    collider?: THREE.Object3D;
    velocity?: THREE.Vector3;
    // Removed 'static' flag - use entityType to determine if entity is static

    constructor(mesh: THREE.Mesh, entityType: EntityType) {
        super();
        this.attach(mesh);
        this.entityType = entityType;
    }
}

export enum EntityType {
    None,
    NPC,
    Player,
    Prop,
    Environment,
    Interactable
}

