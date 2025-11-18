/**
 * Example: How to use EventEmitter with Physics for collision events
 * 
 * This file demonstrates the recommended architecture for handling
 * collision events and other physics-related events.
 */

import * as THREE from 'three';
import { EventEmitter } from '../utils/event-emitter.js';
import { Entity } from '../entities/entity.js';

/**
 * Define the event types that Physics can emit.
 * This provides type safety - TypeScript will ensure:
 * 1. Only valid event names can be used
 * 2. Event data matches the expected type
 */
export interface PhysicsEvents {
    /**
     * Emitted when two entities collide.
     */
    'collision': {
        entity1: Entity;
        entity2: Entity;
        normal: THREE.Vector3;
        depth: number;
    };
    
    /**
     * Emitted when an entity's ground state changes (lands or takes off).
     */
    'groundStateChanged': {
        entity: Entity;
        isOnGround: boolean;
        previousState: boolean;
    };
    
    /**
     * Emitted when an entity's position is updated.
     */
    'positionUpdated': {
        entity: Entity;
        position: THREE.Vector3;
        previousPosition: THREE.Vector3;
    };
}

/**
 * Example Physics class using EventEmitter
 */
export class PhysicsExample extends EventEmitter<PhysicsEvents> {
    // ... physics implementation ...
    
    private handleCollision(entity1: Entity, entity2: Entity, normal: THREE.Vector3, depth: number): void {
        // Resolve collision physics...
        
        // Emit event for other systems to react
        this.emit('collision', {
            entity1,
            entity2,
            normal,
            depth
        });
    }
    
    private updateGroundState(entity: Entity, isOnGround: boolean): void {
        const previousState = this.isOnGround;
        this.isOnGround = isOnGround;
        
        if (previousState !== isOnGround) {
            this.emit('groundStateChanged', {
                entity,
                isOnGround,
                previousState
            });
        }
    }
}

/**
 * Example: How other systems would listen to physics events
 */
export function exampleUsage(physics: PhysicsExample) {
    // Listen to collision events
    physics.on('collision', (data) => {
        console.log(`Collision between ${data.entity1.name} and ${data.entity2.name}`);
        console.log(`Normal:`, data.normal);
        console.log(`Depth:`, data.depth);
        
        // Play sound effect
        // Apply damage
        // Trigger particle effects
        // etc.
    });
    
    // Listen to ground state changes
    physics.on('groundStateChanged', (data) => {
        if (data.isOnGround) {
            console.log(`${data.entity.name} landed!`);
            // Play landing sound
            // Trigger landing particles
        } else {
            console.log(`${data.entity.name} took off!`);
            // Play jump sound
        }
    });
    
    // One-time listener
    physics.once('collision', (data) => {
        console.log('First collision detected!');
    });
    
    // Unsubscribe later
    const unsubscribe = physics.on('positionUpdated', (data) => {
        // Track position...
    });
    
    // Later...
    unsubscribe();
}

