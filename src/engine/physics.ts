import * as THREE from 'three';
import { EntityRegistry } from '../entities/entity-registry.js';
import { Engine } from './engine.js';
import { Entity } from 'src/entities/entity.js';

export class Physics {
    private entityRegistry: EntityRegistry;

    constructor(_engine: Engine) {
        this.entityRegistry = _engine.entityRegistry;
    }

    update(delta: number): void {
        this.entityRegistry.getEntities().forEach(entity => {
            // apply gravity
            // if (!entity.static) this.gravity(entity, delta);

            // check for collisions
            // this.entityRegistry.getEntities().forEach(otherEntity => {
            //     if (entity !== otherEntity) {
            //         if (entity.collider.intersectsBox(otherEntity.collider)) {
            //             this.resolveCollisions(entity, otherEntity);
            //         }
            //     }
            // });
            
            // at the end of the frame, update the position of all entities
            // if (!entity.static) entity.position.add(entity.velocity.clone().multiplyScalar(delta));
            // entity.collider.setFromObject(entity.mesh);
        });
    }

    // resolveCollisions(entity: Entity, otherEntity: Entity): void {
    //     // resolve collisions
    //     const relativeVelocity = entity.velocity.clone().sub(otherEntity.velocity);

    //     // calculate penetration depth
    //     const penetrationX = Math.min(entity.collider.max.x - otherEntity.collider.min.x, otherEntity.collider.max.x - entity.collider.min.x);
    //     const penetrationY = Math.min(entity.collider.max.y - otherEntity.collider.min.y, otherEntity.collider.max.y - entity.collider.min.y);
    //     const penetrationZ = Math.min(entity.collider.max.z - otherEntity.collider.min.z, otherEntity.collider.max.z - entity.collider.min.z);

    //     // get the normal of the collision via the smallest penetration
    //     const penetrationVector = new THREE.Vector3(penetrationX, penetrationY, penetrationZ);
    //     const normal = new THREE.Vector3();
    //     if (penetrationVector.x < penetrationVector.y && penetrationVector.x < penetrationVector.z) {
    //         normal.x = entity.position.x < otherEntity.position.x ? -1 : 1;
    //     } else if (penetrationVector.y < penetrationVector.x && penetrationVector.y < penetrationVector.z) {
    //         normal.y = entity.position.y < otherEntity.position.y ? -1 : 1;
    //     } else {
    //         normal.z = entity.position.z < otherEntity.position.z ? -1 : 1;
    //     }

    //     // calculate the impulse
    //     const impulse = relativeVelocity.dot(normal);
    //     const impulseVector = normal.clone().multiplyScalar(impulse);
    //     entity.velocity.sub(entity.static ? new THREE.Vector3(0) : impulseVector);
    //     otherEntity.velocity.add(otherEntity.static ? new THREE.Vector3(0) : impulseVector);
    // }

    // gravity(entity: Entity, delta: number): void {
    //     entity.velocity.y -= 9.8 * delta;
    // }
}