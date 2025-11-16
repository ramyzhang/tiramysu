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

    update(delta: number): void {
        const player = this.findPlayer();
        if (!player) return;
    
        const input = this.engine.input;
        this.cameraDirection.copy(this.engine.camera.getWorldDirection(new THREE.Vector3()));
        
        if (input.pointerDown) {
            let angle = Math.atan2(input.pointerPosition.y, input.pointerPosition.x) - Math.PI / 2 + this.cameraDirection.y;

            const angleDifference = Math.abs(player.rotation.y - angle);
            if (angleDifference > 0.01) {
                if (angleDifference > Math.PI) {
                    angle -= Math.PI * 2;
                }
                player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, angle, 1 - Math.exp(-delta * this.maxRotationSpeed));
                console.log("angle: " + THREE.MathUtils.radToDeg(angle).toFixed(2) + " player.rotation.y: " + THREE.MathUtils.radToDeg(player.rotation.y).toFixed(2));
                player.updateMatrixWorld();
            }

            player.getWorldDirection(this.playerDirection);
            this.playerDirection.normalize();

            player.velocity.x = this.playerDirection.x * this.moveSpeed;
            player.velocity.z = this.playerDirection.z * this.moveSpeed;
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

