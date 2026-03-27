import * as THREE from 'three';

import { Engine } from './engine.js';
import { Entity, EntityType } from '../entities/entity.js';
import { Player, Interactable, NPC } from '../entities/index.js';
import { EventEmitter } from '../utils/event-emitter.js';

/**
 * Physics event types that can be emitted.
 */
export interface PhysicsEvents {
    /**
     * Emitted when the player collides with an interactable entity.
     */
    'interactableCollision': {
        entity: Interactable | NPC;
        player: Entity;
        isColliding: boolean; // true when entering collision, false when exiting
    };
}

export class Physics extends EventEmitter<PhysicsEvents> {
    private engine: Engine;
    private player: Player;
    private environment: THREE.Mesh;
    private playerHeight: number = 0;

    private tempVecA: THREE.Vector3 = new THREE.Vector3();
    private tempVecB: THREE.Vector3 = new THREE.Vector3();
    private tempCapsuleStart: THREE.Vector3 = new THREE.Vector3();
    private tempCapsuleEnd: THREE.Vector3 = new THREE.Vector3();
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
        // player and environment will be set in init()
        this.player = null!;
        this.environment = null!;
        this.raycaster = new THREE.Raycaster();
    }

    init(player: Player, environment: Entity): void {
        this.player = player;
        // Environment's collider is the actual mesh we need
        this.environment = environment.collider as THREE.Mesh;
        if (!this.environment) {
            console.warn('Environment entity missing collider');
        }
        this.raycaster.layers.enableAll();
        this.playerHeight = this.player.capsule.start.distanceTo(this.player.capsule.end) + this.player.capsule.radius;
    }

    update(delta: number): void {
        if (!this.environment.geometry.boundsTree) {
            console.warn("BVH not ready yet!");
            return;
        }

        this.gravity(delta);

        this.checkCollisions();  // Modifies tempLine
        this.resolveCollisions(delta);  // Uses tempLine

        if (this.player.velocity) {
            this.player.position.addScaledVector(this.player.velocity, delta);
        }
        this.player.updateMatrixWorld();
    }

    gravity(delta: number): void {
        if (!this.player.velocity) {
            this.player.velocity = new THREE.Vector3(0, 0, 0);
        }
        this.player.velocity.y -= 9.8 * delta * this.player.weight;
    }

    checkCollisions(): void { 
        this.tempMat.copy(this.environment!.matrixWorld).invert();
        this.tempCapsuleStart.copy(this.player.capsule.start)
            .applyMatrix4(this.player!.matrixWorld)
            .applyMatrix4(this.tempMat);
        this.tempCapsuleEnd.copy(this.player.capsule.end)
            .applyMatrix4(this.player!.matrixWorld)
            .applyMatrix4(this.tempMat);
        this.tempLine = new THREE.Line3(this.tempCapsuleStart, this.tempCapsuleEnd);

        this.tempAABB.setFromObject(this.player!);
        const radius = this.player.capsule.radius;
    
        // environmental collisions (i.e. the terrain)
        (this.environment! as THREE.Mesh).geometry.boundsTree?.shapecast({
            intersectsBounds: box => this.player.capsule.intersectsBox(box),
    
            intersectsTriangle: (tri) => {
                const triPoint = this.tempVecA;
                const playerPoint = this.tempVecB;
                
                const distance = tri.closestPointToSegment(this.tempLine, triPoint, playerPoint);
                if (distance < radius) {
                    const depth = radius - distance;
                    const direction = playerPoint.sub(triPoint).normalize();
    
                    // Accumulate all corrections into tempLine
                    this.tempCapsuleStart.addScaledVector(direction, depth);
                    this.tempCapsuleEnd.addScaledVector(direction, depth);
                }
            }
        });

        // Check for interactable collisions
        // Note: We iterate registry for interactables since they can be dynamically added (like dialogue bubbles)
        for (const e of this.engine.entityRegistry.getEntities()) {
            if (e.entityType === EntityType.Interactable || e.entityType === EntityType.NPC) {
                const entity = e as Interactable | NPC;
                if (entity.sphere) {
                    this.tempSphere.copy(entity.sphere);
                    this.tempSphere.applyMatrix4(entity.matrixWorld);
                    
                    const isColliding = this.tempAABB.intersectsSphere(this.tempSphere);
                    const wasColliding = this.collidingEntities.has(entity);
                    
                    if (isColliding && !wasColliding) {
                        this.collidingEntities.add(entity);
                        this.emit('interactableCollision', {
                            entity,
                            player: this.player,
                            isColliding: true
                        });
                    } else if (!isColliding && wasColliding) {
                        this.collidingEntities.delete(entity);
                        this.emit('interactableCollision', {
                            entity,
                            player: this.player,
                            isColliding: false
                        });
                    }
                }
            }
        }
    }
    
    resolveCollisions(delta: number): void {
        const newPosition = this.tempVecA;
        newPosition.copy(this.tempLine.start).applyMatrix4(this.environment.matrixWorld);
    
        const deltaVector = this.tempVecB;
        deltaVector.subVectors(newPosition, this.player.position);
    
        const hadCollision = deltaVector.length() > 0.005;

        // isOnGround check (raycasting downwards)
        this.raycaster.set(this.player.position, new THREE.Vector3(0, -1, 0));
        const intersects = this.raycaster.intersectObject(this.environment);
        if (intersects.length > 0 && intersects[0].distance < (this.playerHeight + 0.2)) {
            this.isOnGround = true;
        } else {
            this.isOnGround = false;
        }

        // always zero out downward velocity when grounded, regardless of collision threshold
        if (this.isOnGround && this.player.velocity && this.player.velocity.y < 0) {
            this.player.velocity.y = 0;
        }

        if (hadCollision) {
            const offset = Math.max(0, deltaVector.length() - 1e-5);
            deltaVector.normalize().multiplyScalar(offset);

            this.player.position.add(deltaVector);

            if (this.player.velocity && !this.isOnGround) {
                deltaVector.normalize();
                this.player.velocity.addScaledVector(deltaVector, -deltaVector.dot(this.player.velocity));
            }
        }
    }
}