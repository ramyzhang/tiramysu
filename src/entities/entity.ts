import * as THREE from 'three';

export class Entity extends THREE.Object3D {
    collider: THREE.Box3;
    mesh: THREE.Mesh;
    entityType: EntityType;
    velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
    static: boolean = false;

    constructor(mesh: THREE.Mesh, entityType: EntityType) {
        super();
        this.mesh = mesh;
        this.entityType = entityType;
        this.add(mesh);
        this.collider = new THREE.Box3().setFromObject(this.mesh);
        this.add(new THREE.Box3Helper(this.collider, 0xffff00));
    }
}

export enum EntityType {
    NPC,
    Player,
    Prop,
    Environment
}

