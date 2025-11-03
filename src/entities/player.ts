import * as THREE from 'three';
import { Entity, EntityType } from "./entity.js";
import { Colours } from '../constants/colours.js';
import { Engine } from '../engine/engine.js';

export class Player extends Entity {
    private engine: Engine;
    private currentPath: THREE.Vector3[] = [];
    private moveSpeed: number = 5.0;
    private isMoving: boolean = false;

    constructor(_engine: Engine) {
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
        this.engine = _engine;
        this.name = 'Player';
    }

    /**
     * Set a new destination and calculate path
     */
    setDestination(destination: THREE.Vector3): void {        
        this.currentPath = this.engine.navigation.findPath(this.position, destination);
        this.isMoving = this.currentPath.length > 0;
                
        console.log('Pathfinding:', {
            start: this.position,
            end: destination,
            pathLength: this.currentPath.length
        });
    }

    /**
     * Update player movement along the current path
     */
    updateMovement(delta: number): void {
        if (!this.isMoving || this.currentPath.length <= 0) {
            return;
        }

        const targetPoint = this.currentPath[0];
        const direction = targetPoint.clone().sub(this.position);
        const distance = direction.lengthSq();

        if (distance > 0.5 * 0.5) {
            direction.normalize();
            const moveDistance = this.moveSpeed * delta;
            this.position.add(direction.multiplyScalar(moveDistance));
        } else {
            this.currentPath.shift();
        }

        this.engine.navigation.drawPath(this.currentPath);
    }

    /**
     * Check if player is currently moving
     */
    getIsMoving(): boolean {
        return this.isMoving;
    }

    /**
     * Get current path for debugging
     */
    getCurrentPath(): THREE.Vector3[] {
        return this.currentPath;
    }
}