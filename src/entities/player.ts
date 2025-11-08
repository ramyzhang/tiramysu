import * as THREE from 'three';
import { Entity, EntityType } from "./entity.js";
import { Colours } from '../constants/colours.js';
import { Engine } from '../engine/engine.js';
import { Layers } from '../constants/layers.js';

export class Player extends Entity {    
    constructor() {
        const head = new THREE.SphereGeometry(0.5);
        const body = new THREE.ConeGeometry(0.5, 2, 8);
        const leftLeg = new THREE.CylinderGeometry(0.1, 0.1, 0.5);
        const rightLeg = new THREE.CylinderGeometry(0.1, 0.1, 0.5);

        const headMesh = new THREE.Mesh(head, new THREE.MeshLambertMaterial({ color: Colours.pink }));
        const bodyMesh = new THREE.Mesh(body, new THREE.MeshLambertMaterial({ color: Colours.rose }));
        const leftLegMesh = new THREE.Mesh(leftLeg, new THREE.MeshLambertMaterial({ color: Colours.rose }));
        const rightLegMesh = new THREE.Mesh(rightLeg, new THREE.MeshLambertMaterial({ color: Colours.rose }));

        bodyMesh.position.y = -0.5;
        leftLegMesh.position.set(-0.25, -1.25, 0);
        rightLegMesh.position.set(0.25, -1.25, 0);

        headMesh.add(bodyMesh);
        bodyMesh.add(leftLegMesh, rightLegMesh);

        headMesh.position.y = 2.5;

        super(headMesh, EntityType.Player);

        this.position.set(0, 4.0, -10.0);
        this.name = 'Player';
        for (const child of this.mesh.children) {
            child.layers.set(Layers.Player);
        }
    }
}