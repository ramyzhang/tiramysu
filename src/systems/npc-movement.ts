import * as THREE from 'three';
import { System } from './system.js';
import { Engine } from '../engine/engine.js';
import { Player } from '../entities/player.js';
import { NPC } from '../entities/npc.js';
import { EntityType } from '../entities/entity.js';

/**
 * System that handles NPC behavior, such as looking at the player
 * when they enter the NPC's collision sphere.
 */
export class NPCMovementSystem extends System {
    private player: Player | null = null;
    private npcsInRange: Set<NPC> = new Set(); // Track NPCs currently in collision range
    private lookAtSpeed: number = 3.0; // Rotation speed multiplier
    private tempVecA: THREE.Vector3 = new THREE.Vector3();
    private unsubscribeCollision: (() => void) | null = null;

    constructor(engine: Engine) {
        super(engine);
        
        // Subscribe to physics collision events
        this.unsubscribeCollision = this.engine.physics.on('interactableCollision', (data) => {
            // Only handle NPC collisions
            if (data.entity.entityType === EntityType.NPC && data.entity instanceof NPC) {
                const npc = data.entity;
                if (data.isColliding) {
                    // Player entered NPC's collision sphere
                    this.npcsInRange.add(npc);
                } else {
                    // Player exited NPC's collision sphere
                    this.npcsInRange.delete(npc);
                }
            }
        });
    }

    /**
     * Find and store the player entity from the entity registry.
     */
    private findPlayer(): Player | null {
        if (this.player) {
            // Check if player still exists in the registry
            const entities = this.engine.entityRegistry.getEntities();
            if (entities.find(e => e === this.player)) {
                return this.player;
            } else {
                // Player was removed, clear reference
                this.player = null;
            }
        }

        // Try to find player in registry
        const entities = this.engine.entityRegistry.getEntities();
        for (const entity of entities) {
            if (entity.entityType === EntityType.Player && entity instanceof Player) {
                this.player = entity;
                return this.player;
            }
        }

        return null;
    }

    /**
     * Smoothly rotates the NPC to look at the target position.
     * Only rotates around the Y-axis (horizontal rotation).
     */
    private lookAtSmooth(npc: NPC, targetPosition: THREE.Vector3, delta: number): void {
        // Calculate direction from NPC to target
        this.tempVecA.subVectors(targetPosition, npc.position);
        this.tempVecA.y = 0; // Only rotate horizontally
        this.tempVecA.normalize();

        if (this.tempVecA.length() < 0.001) {
            return; // Too close, skip rotation
        }

        // Calculate target rotation (Y-axis only)
        const targetYRotation = Math.atan2(this.tempVecA.x, this.tempVecA.z);

        // Get current Y rotation
        const currentYRotation = npc.rotation.y;

        // Calculate shortest angular difference
        let deltaAngle = targetYRotation - currentYRotation;
        
        // Normalize to [-π, π] to take shortest path
        while (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
        while (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

        // Smoothly interpolate rotation
        const rotationSpeed = this.lookAtSpeed * delta;
        const newYRotation = currentYRotation + deltaAngle * Math.min(rotationSpeed, 1.0);

        // Apply rotation (only Y-axis)
        npc.rotation.y = newYRotation;
        npc.updateMatrixWorld();
    }

    update(delta: number): void {
        const player = this.findPlayer();
        if (!player) return;

        // Update lookAt for all NPCs currently in range
        for (const npc of this.npcsInRange) {
            // Make NPC look at player
            this.lookAtSmooth(npc, player.position, delta);
        }
    }

    /**
     * Clean up event listeners when the system is disposed.
     */
    dispose(): void {
        if (this.unsubscribeCollision) {
            this.unsubscribeCollision();
            this.unsubscribeCollision = null;
        }
    }
}

