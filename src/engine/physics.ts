import * as THREE from 'three';

import { Engine } from './engine.js';
import { Entity, EntityType } from '../entities/entity.js';
import { Player, Interactable, NPC } from '../entities/index.js';
import { EventEmitter } from '../utils/event-emitter.js';

export interface PhysicsEvents {
    // true when entering collision, false when exiting
    'interactableCollision': {
        entity: Interactable | NPC;
        player: Entity;
        isColliding: boolean;
    };
}

export class Physics extends EventEmitter<PhysicsEvents> {
    private engine: Engine;
    private player: Player;
    private environment: THREE.Mesh;
    private playerHalfHeight: number = 0;

    // Reusable temporaries to avoid per-frame allocations
    private tempVecA: THREE.Vector3 = new THREE.Vector3();
    private tempVecB: THREE.Vector3 = new THREE.Vector3();
    private tempLine: THREE.Line3 = new THREE.Line3();
    private tempMat: THREE.Matrix4 = new THREE.Matrix4();
    private tempAABB: THREE.Box3 = new THREE.Box3();
    private tempSphere: THREE.Sphere = new THREE.Sphere();

    private raycaster: THREE.Raycaster;
    private collidingEntities: Set<Entity> = new Set();

    public isOnGround: boolean = false;

    constructor(_engine: Engine) {
        super();
        this.engine = _engine;
        this.player = null!;
        this.environment = null!;
        this.raycaster = new THREE.Raycaster();
    }

    init(player: Player, environment: Entity): void {
        this.player = player;
        this.environment = environment.collider as THREE.Mesh;
        if (!this.environment) {
            console.warn('Environment entity missing collider');
        }
        this.raycaster.layers.enableAll();
        this.playerHalfHeight = this.player.capsule.start.distanceTo(this.player.capsule.end) + this.player.capsule.radius;
    }

    update(delta: number): void {
        if (!this.environment.geometry.boundsTree) {
            console.warn('BVH not ready yet!');
            return;
        }

        this.gravity(delta);

        if (this.player.velocity) {
            this.player.position.addScaledVector(this.player.velocity, delta);
        }
        this.player.updateMatrixWorld(); // must refresh before collision detection reads matrixWorld

        this.checkCollisions();
        this.resolveCollisions();
    }

    private gravity(delta: number): void {
        if (!this.player.velocity) {
            this.player.velocity = new THREE.Vector3(0, 0, 0);
        }

        this.raycaster.set(this.player.position, new THREE.Vector3(0, -1, 0));
        const intersects = this.raycaster.intersectObjects([this.environment]);

        if (intersects.length > 0 && intersects[0].distance <= this.playerHalfHeight + 0.1) {
            this.isOnGround = true;
        } else {
            this.isOnGround = false;
            this.player.velocity.y -= 9.8 * delta * this.player.weight;
        }
    }

    private checkCollisions(): void {
        this.tempMat.copy(this.environment.matrixWorld).invert();
        this.tempLine
            .set(this.player.capsule.start, this.player.capsule.end)
            .applyMatrix4(this.player.matrixWorld)
            .applyMatrix4(this.tempMat);

        this.tempAABB.setFromObject(this.player);
        this.tempAABB.applyMatrix4(this.tempMat);
        const radius = this.player.capsule.radius;

        this.environment.geometry.boundsTree?.shapecast({
            intersectsBounds: box => box.intersectsBox(this.tempAABB),

            intersectsTriangle: (tri) => {
                const triPoint = this.tempVecA;
                const playerPoint = this.tempVecB;

                const distance = tri.closestPointToSegment(this.tempLine, triPoint, playerPoint);
                if (distance < radius) {
                    const depth = radius - distance;
                    const direction = playerPoint.sub(triPoint).normalize();
                    this.tempLine.start.addScaledVector(direction, depth);
                    this.tempLine.end.addScaledVector(direction, depth);
                }
            }
        });

        // Interactables can be dynamically added (e.g. dialogue bubbles), so we check the registry each frame
        for (const e of this.engine.entityRegistry.getEntities()) {
            if (e.entityType !== EntityType.Interactable && e.entityType !== EntityType.NPC) continue;

            const entity = e as Interactable | NPC;
            if (!entity.sphere) continue;

            this.tempSphere.copy(entity.sphere).applyMatrix4(entity.matrixWorld);
            this.tempAABB.setFromObject(this.player);

            const isColliding = this.tempAABB.intersectsSphere(this.tempSphere);
            const wasColliding = this.collidingEntities.has(entity);

            if (isColliding && !wasColliding) {
                this.collidingEntities.add(entity);
                this.emit('interactableCollision', { entity, player: this.player, isColliding: true });
            } else if (!isColliding && wasColliding) {
                this.collidingEntities.delete(entity);
                this.emit('interactableCollision', { entity, player: this.player, isColliding: false });
            }
        }
    }

    private resolveCollisions(): void {
        if (!this.player.velocity) return;

        const newPosition = this.tempVecA;
        newPosition.copy(this.tempLine.start).applyMatrix4(this.environment.matrixWorld);

        const deltaVector = this.tempVecB;
        deltaVector.subVectors(newPosition, this.player.position);

        if (deltaVector.length() > 0.005) {
            const offset = Math.max(0, deltaVector.length() - 1e-5);
            deltaVector.normalize().multiplyScalar(offset);

            this.player.position.add(deltaVector);

            deltaVector.normalize();
            const dot = deltaVector.dot(this.player.velocity);
            if (dot < 0) {
                this.player.velocity.addScaledVector(deltaVector, -dot);
            }
        }
    }
}
