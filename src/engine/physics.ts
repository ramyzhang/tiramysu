import * as THREE from 'three';

import { Engine } from './engine.js';
import { Entity, EntityType } from '../entities/entity.js';
import { Player } from '../entities/player.js';
import { Layers } from '../constants.js';
import { Interactable } from '../entities/interactable.js';

export class Physics {
    private engine: Engine;
    private player: Entity | null = null;
    private environment: THREE.Mesh | null = null;
    public isOnGround: boolean = false;

    private tempVecA: THREE.Vector3 = new THREE.Vector3();
    private tempVecB: THREE.Vector3 = new THREE.Vector3();
    private tempLine: THREE.Line3 = new THREE.Line3();
    private tempMat: THREE.Matrix4 = new THREE.Matrix4();
    private tempAABB: THREE.Box3 = new THREE.Box3();

    private raycaster: THREE.Raycaster;

    constructor(_engine: Engine) {
        this.engine = _engine;
        this.player = null;
        this.environment = null;
        this.raycaster = new THREE.Raycaster();
    }

    public init(): void {
        for (const e of this.engine.entityRegistry.getEntities()) {
            if (e.entityType === EntityType.Player) {
                this.player = e;
            }
            if (e.entityType === EntityType.Environment) {
                this.environment = e.collider as THREE.Mesh;
            }
        }

        this.raycaster.layers.enableAll();
    }

    update(delta: number): void {
        if (this.player && this.environment) {
            if (!(this.environment as THREE.Mesh).geometry.boundsTree) {
                console.warn("BVH not ready yet!");
                return;
            }

            this.gravity(delta);
    
            this.checkCollisions();  // Modifies tempLine
            this.resolveCollisions(delta);  // Uses tempLine
    
            this.player!.position.addScaledVector(this.player!.velocity, delta);
            this.player!.updateMatrixWorld();
        }
    }

    gravity(delta: number): void {
        this.player!.velocity.y -= 9.8 * delta * (this.player as Player).weight;
    }

    checkCollisions(): void {  // Return void, modify tempLine directly
        this.tempMat.copy(this.environment!.matrixWorld).invert();
        this.tempLine.copy((this.player as Player).capsule.lineSegment)
            .applyMatrix4(this.player!.matrixWorld)
            .applyMatrix4(this.tempMat);
    
        this.tempAABB.setFromObject(this.player!);
        const radius = (this.player as Player).capsule.radius;
    
        (this.environment! as THREE.Mesh).geometry.boundsTree?.shapecast({
            intersectsBounds: box => box.intersectsBox(this.tempAABB),
    
            intersectsTriangle: (tri) => {
                const triPoint = this.tempVecA;
                const playerPoint = this.tempVecB;
    
                const distance = tri.closestPointToSegment(this.tempLine, triPoint, playerPoint);
                if (distance < radius) {
                    const depth = radius - distance;
                    const direction = playerPoint.sub(triPoint).normalize();
    
                    // Accumulate all corrections into tempLine
                    this.tempLine.start.addScaledVector(direction, depth);
                    this.tempLine.end.addScaledVector(direction, depth);
                }
            }
        });

        for (const e of this.engine.entityRegistry.getEntities()) {
            if (e.entityType === EntityType.Interactable) {
                const interactable = e as Interactable;
                if ((interactable.collider! as THREE.Box3Helper).box.intersectsBox(this.tempAABB)) {
                    console.log("interactable", interactable.name);
                }
            }
        }
    }
    
    resolveCollisions(delta: number): void {
        const newPosition = this.tempVecA;
        newPosition.copy(this.tempLine.start).applyMatrix4(this.environment!.matrixWorld);
    
        const deltaVector = this.tempVecB;
        deltaVector.subVectors(newPosition, this.player!.position);
    
        const hadCollision = deltaVector.length() > 0.005;

        // Only update ground state if we had a collision
        // raycast down from the player's position to check if we are on the ground
        this.raycaster.set(this.player!.position, this.player!.position.clone().add(new THREE.Vector3(0, -3, 0)));
        const intersects = this.raycaster.intersectObjects([this.environment!]);
        if (intersects.length > 0) {
            console.log("intersects", intersects[0]);
            this.isOnGround = true;
        } else {
            this.isOnGround = false;
        }

        if (hadCollision) {
            const offset = Math.max(0, deltaVector.length() - 1e-5);
            deltaVector.normalize().multiplyScalar(offset);

            this.player!.position.add(deltaVector);

            if (!this.isOnGround) {
                deltaVector.normalize();
                this.player!.velocity.addScaledVector(deltaVector, -deltaVector.dot(this.player!.velocity));
            } else {
                this.player!.velocity.y = 0;
            }
        }
    }
}