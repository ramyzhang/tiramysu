import * as THREE from 'three';
import { EntityRegistry } from '../entities/entity-registry.js';
import { Engine } from './engine.js';
import { Entity } from 'src/entities/entity.js';
import { Layers } from '../constants/layers.js';

const MAX_RAYCAST_DISTANCE: number = 10;

export class Physics {
    private engine: Engine;
    private entityRegistry: EntityRegistry;
    private raycaster: THREE.Raycaster;

    constructor(_engine: Engine) {
        this.engine = _engine;
        this.entityRegistry = _engine.entityRegistry;
        this.raycaster = new THREE.Raycaster();
    }

    update(delta: number): void {
        this.entityRegistry.getEntities().forEach(e => {
            // apply gravity
            if (!e.static) this.gravity(e, delta);

            // Check terrain collision for non-static entities
            if (!e.static && e.collider) {
                this.checkEnvironmentCollision(e);
            }

            // check for collisions between entities
            this.entityRegistry.getEntities().forEach(o => {
                if (e !== o && !o.static) {
                    if (e.collider && o.collider && e.collider.intersectsBox(o.collider)) {
                        this.resolveAABBCollisions(e, o);
                    }
                }
            });
            
            // at the end of the frame, update the position of all entities
            if (!e.static) e.position.add(e.velocity.clone().multiplyScalar(delta));
            if (e.collider) e.collider.setFromObject(e.mesh);
        });
    }

    /**
     * Resolve collisions between two AABB entities.
     */
    resolveAABBCollisions(e: Entity, o: Entity): void {
        const relativeVelocity = e.velocity.clone().sub(o.velocity);

        const eMax = e.collider!.max;
        const eMin = e.collider!.min;
        const oMax = o.collider!.max;
        const oMin = o.collider!.min;

        // calculate penetration depth
        const penetrationX = Math.min(eMax.x - oMin.x, oMax.x - eMin.x);
        const penetrationY = Math.min(eMax.y - oMin.y, oMax.y - eMin.y);
        const penetrationZ = Math.min(eMax.z - oMin.z, oMax.z - eMin.z);

        // get the normal of the collision via the smallest penetration
        const penetrationVector = new THREE.Vector3(penetrationX, penetrationY, penetrationZ);
        const normal = new THREE.Vector3();
        if (penetrationVector.x < penetrationVector.y && penetrationVector.x < penetrationVector.z) {
            normal.x = e.position.x < o.position.x ? -1 : 1;
        } else if (penetrationVector.y < penetrationVector.x && penetrationVector.y < penetrationVector.z) {
            normal.y = e.position.y < o.position.y ? -1 : 1;
        } else {
            normal.z = e.position.z < o.position.z ? -1 : 1;
        }

        // calculate the impulse
        const impulse = relativeVelocity.dot(normal);
        const impulseVector = normal.clone().multiplyScalar(impulse);
        e.velocity.sub(e.static ? new THREE.Vector3(0) : impulseVector);
        o.velocity.add(o.static ? new THREE.Vector3(0) : impulseVector);
    }

    gravity(e: Entity, delta: number): void {
        e.velocity.y -= 9.8 * delta;
    }

    /**
     * Check if an AABB collides with the environment using raycast.
     * Casts rays downward from the bottom of the entity's collider.
     * Uses Layers.Environment to filter terrain objects.
     */
    private checkEnvironmentCollision(e: Entity): void {
        // Get the bottom center of the AABB
        const bottomCenter = new THREE.Vector3(
            e.collider!.min.x + (e.collider!.max.x - e.collider!.min.x) * 0.5,
            e.collider!.min.y,
            e.collider!.min.z + (e.collider!.max.z - e.collider!.min.z) * 0.5
        );

        // Set raycaster to check Environment layer only
        this.raycaster.layers.set(Layers.Environment);

        // Cast ray downward from the bottom center
        this.raycaster.set(bottomCenter, new THREE.Vector3(0, -1, 0));
            
        // Intersect with all objects in the scene on the Environment layer
        const intersects = this.raycaster.intersectObjects(this.engine.scene.children, true);
        
        if (intersects.length > 0) {
            const groundHeight = intersects[0].point.y;
            this.resolveEnvironmentCollision(e, groundHeight);
        }
    }

    /**
     * Resolve collision between an entity and the environment.
     * @param e The entity colliding with the environment
     * @param groundHeight The Y coordinate of the ground surface
     */
    private resolveEnvironmentCollision(e: Entity, groundHeight: number): void {
        // If entity is below or intersecting ground, push it up
        const normal = new THREE.Vector3(0, 1, 0);
        const relativeVelocity = e.velocity.clone();
        const impulse = relativeVelocity.dot(normal);
        const impulseVector = normal.clone().multiplyScalar(impulse);
        e.velocity.sub(e.static ? new THREE.Vector3(0) : impulseVector);
    }
}