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
    private npcs: NPC[] = [];
    private lookAtSpeed: number = 3.0; // Rotation speed multiplier
    private tempSphere: THREE.Sphere = new THREE.Sphere();
    private tempVecA: THREE.Vector3 = new THREE.Vector3();

    constructor(engine: Engine) {
        super(engine);
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
     * Find all NPCs in the entity registry.
     */
    private findNPCs(): NPC[] {
        const entities = this.engine.entityRegistry.getEntities();
        const foundNPCs: NPC[] = [];

        for (const entity of entities) {
            if (entity.entityType === EntityType.NPC && entity instanceof NPC) {
                foundNPCs.push(entity);
            }
        }

        return foundNPCs;
    }

    /**
     * Checks if the player is within an NPC's collision sphere.
     */
    private isPlayerInNPCRange(npc: NPC, player: Player): boolean {
        // Get the NPC's sphere in world space
        this.tempSphere.copy(npc.sphere);
        this.tempSphere.applyMatrix4(npc.matrixWorld);

        // Check if player position is within the sphere
        const distance = this.tempSphere.center.distanceTo(player.position);
        return distance <= this.tempSphere.radius;
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
    }

    update(delta: number): void {
        const player = this.findPlayer();
        if (!player) return;

        // Find all NPCs
        this.npcs = this.findNPCs();
        if (this.npcs.length === 0) return;

        // Update each NPC
        for (const npc of this.npcs) {
            // Check if player is within NPC's collision sphere
            if (this.isPlayerInNPCRange(npc, player)) {
                // Make NPC look at player
                this.lookAtSmooth(npc, player.position, delta);
            }
        }
    }
}

