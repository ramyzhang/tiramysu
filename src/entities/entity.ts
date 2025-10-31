import * as THREE from 'three';

export class Entity extends THREE.Object3D {
    mesh: THREE.Mesh;
    entityType: EntityType;
    velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
    static: boolean = false;

    constructor(mesh: THREE.Mesh, entityType: EntityType) {
        super();
        this.mesh = mesh;
        this.entityType = entityType;
        this.add(mesh);
    }

    forward(target?: THREE.Vector3): THREE.Vector3 {
        target = target || new THREE.Vector3();
        this.getWorldDirection(target);
        return target;
    }
}

export enum EntityType {
    NPC,
    Player,
    Prop,
    Environment
}

