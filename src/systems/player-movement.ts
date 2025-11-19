import * as THREE from 'three';
import { System } from './system.js';
import { Engine } from '../engine/engine.js';
import { Player } from '../entities/player.js';
import { EntityType } from '../entities/entity.js';
import { PlayerSpawnPosition } from '../constants.js';

export class PlayerMovementSystem extends System {
    private player: Player | null = null;
    private maxRotationSpeed: number = 2.0; // Radians per second
    private moveSpeed: number = 5.0; // Units per second
    private playerDirection: THREE.Vector3 = new THREE.Vector3();
    private cameraDirection: THREE.Vector3 = new THREE.Vector3();

    private inputDirection: THREE.Vector2 = new THREE.Vector2();

    private tempVecA: THREE.Vector3 = new THREE.Vector3();
    private tempVecB: THREE.Vector3 = new THREE.Vector3();
    private tempMat: THREE.Matrix4 = new THREE.Matrix4();

    constructor(engine: Engine) {
        super(engine);
        this.cameraDirection.copy(this.engine.camera.getWorldDirection(new THREE.Vector3()));
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
     * Lerps between two angles, taking the shortest path and handling 0/360 degree wrapping.
     * @param current Current angle in radians
     * @param target Target angle in radians
     * @param t Interpolation factor (0-1)
     * @returns Interpolated angle in radians, normalized to [0, 2π]
     */
    private lerpAngle(current: number, target: number, t: number): number {
        // Normalize both angles to [0, 2π]
        current = ((current % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
        target = ((target % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);

        // Calculate the shortest angular difference
        let delta = target - current;
        
        // Normalize delta to [-π, π] to always take the shortest path
        if (delta > Math.PI) {
            delta -= 2 * Math.PI;
        } else if (delta < -Math.PI) {
            delta += 2 * Math.PI;
        }

        // Lerp and normalize result
        const result = current + delta * t;
        return ((result % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
    }

    update(delta: number): void {
        const player = this.findPlayer();
        if (!player) return;
    
        const input = this.engine.input;
        this.inputDirection.copy(input.pointerPosition);

        this.cameraDirection = this.engine.camera.getWorldDirection(this.cameraDirection);
        this.cameraDirection.y = 0;
        this.cameraDirection.normalize();

        // Check if player is interacting - if so, don't process movement
        const interactionSystem = this.engine.world.interactionSystem;
        if (interactionSystem && interactionSystem.isCurrentlyInteracting()) {
            // Player is clicking on an interactable, don't process movement
            console.log("nya");
            player.velocity.x = 0;
            player.velocity.z = 0;
            return;
        }

        if (input.pointerDown) {
            let desiredLocalCameraAngle = Math.atan2(this.inputDirection.y, this.inputDirection.x);

            // get the right vector of the camera
            this.tempVecA = this.cameraDirection.clone().cross(new THREE.Vector3(0, 1, 0));
            const newDir = this.tempVecA;

            newDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), desiredLocalCameraAngle);
            newDir.normalize();

            // normalize to [0, 2π]
            if (desiredLocalCameraAngle < 0) {
                desiredLocalCameraAngle += 2 * Math.PI;
            }

            player.lookAt(player.position.clone().add(newDir));

            player.velocity.x = newDir.x * this.moveSpeed;
            player.velocity.z = newDir.z * this.moveSpeed;
        } else {
            // When not moving, zero out horizontal velocity
            player.velocity.x = 0;
            player.velocity.z = 0;
        }

        if (player.position.y < -25) {
            player.position.copy(PlayerSpawnPosition);
            player.velocity.set(0, 0, 0);  // Reset velocity too
        }
    }
}

