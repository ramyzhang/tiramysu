import * as THREE from 'three';

import { Entity, EntityType } from "./entity.js";
import { Colours, Layers, PlayerSpawnPosition, PlayerSpawnDirection } from '../constants.js';

export class Capsule {
    radius: number = 0.5;
    lineSegment: THREE.Line3 = new THREE.Line3(new THREE.Vector3(), new THREE.Vector3(0, -0.5, 0));
}

export class Player extends Entity {    
    capsule: Capsule = new Capsule();

    constructor() {
        // use rounded box geometry for the capsule
        const cylinder = new THREE.CapsuleGeometry(0.5, 1.0, 4, 10);
        const material = new THREE.MeshLambertMaterial({ color: Colours.rose, wireframe: true });
        const mesh = new THREE.Mesh(cylinder, material);

        super(mesh, EntityType.Player);
        this.attach(mesh);
        this.position.copy(PlayerSpawnPosition);

        const coneNose = new THREE.ConeGeometry(0.25, 0.5, 32);
        const coneMaterial = new THREE.MeshLambertMaterial({ color: Colours.forestGreen, wireframe: true });
        const cone = new THREE.Mesh(coneNose, coneMaterial);
        this.add(cone);
        cone.rotateX(Math.PI / 2);
        cone.position.y = 0.5;
        cone.position.z = 0.25;

        this.name = 'Player';
        for (const child of this.children) {
            child.layers.set(Layers.Player);
        }
        this.lookAt(PlayerSpawnPosition.add(PlayerSpawnDirection));
    }
}