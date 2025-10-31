import * as THREE from 'three';
import { Entity, EntityType } from "./entity.js";
import { Colours } from '../constants/colours.js';
import { Engine } from '../engine/engine.js';

export class Player extends Entity {
    private engine: Engine;
    private currentPath: THREE.Vector3[] = [];
    private pathIndex: number = 0;
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

        headMesh.position.y = 3;

        super(headMesh, EntityType.Player);

        this.position.set(0, 8.0, -10.0);
        this.engine = _engine;
        this.name = 'Player';
    }

    /**
     * Set a new destination and calculate path
     */
    setDestination(destination: THREE.Vector3): void {
        // const startPos = this.engine.navigation.snapToNavMesh(this.position);
        // const endPos = this.engine.navigation.snapToNavMesh(destination);
        
        this.currentPath = this.engine.navigation.findPath(this.position, destination);
        this.pathIndex = 0;
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
        if (!this.isMoving || this.currentPath.length === 0) {
            return;
        }

        const targetPoint = this.currentPath[this.pathIndex];
        const direction = targetPoint.clone().sub(this.position);
        const distance = direction.length();

        if (distance < 0.1) {
            this.pathIndex++;
            if (this.pathIndex >= this.currentPath.length) {
                this.isMoving = false;
                this.currentPath = [];

                this.engine.navigation.clearPath();
                return;
            }
        } else {
            direction.normalize();
            const moveDistance = this.moveSpeed * delta;
            const newPosition = this.position.clone().add(direction.multiplyScalar(moveDistance));
            
            this.position.copy(newPosition);
        }
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