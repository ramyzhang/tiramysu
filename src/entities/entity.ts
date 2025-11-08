import { Layers } from '../constants/layers.js';
import * as THREE from 'three';

export class Entity extends THREE.Object3D {
    mesh: THREE.Mesh;
    entityType: EntityType;
    collider: THREE.Box3 | null = null;
    debugCollider: THREE.Box3Helper | null = null;
    velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
    static: boolean = false;

    constructor(mesh: THREE.Mesh, entityType: EntityType, createCollider: boolean = true) {
        super();
        this.mesh = mesh;
        this.entityType = entityType;
        this.add(mesh);
        if (createCollider) {
            // create collider at half size of the mesh
            this.collider = new THREE.Box3().setFromObject(this.mesh).expandByScalar(0.5);
            this.debugCollider = new THREE.Box3Helper(this.collider, 0xffff00);
            this.debugCollider.layers.set(Layers.Ignore);
        }
    }
}

export enum EntityType {
    NPC,
    Player,
    Prop,
    Environment
}

