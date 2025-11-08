import * as THREE from 'three';
import { System } from './system.js';
import { Engine } from '../engine/engine.js';
import { Player } from '../entities/player.js';
import { EntityType } from '../entities/entity.js';

export class PlayerMovementSystem extends System {
    private player: Player | null = null;
    private isPointerDown: boolean = false;
    private pointerX: number = 0; // Normalized device coordinates (-1 to 1)
    private maxRotationSpeed: number = 2.0; // Radians per second
    private moveSpeed: number = 5.0; // Units per second

    constructor(engine: Engine) {
        super(engine);
        this.setupInput();
    }

    private setupInput(): void {
        window.addEventListener('pointerdown', (e: PointerEvent) => {
            this.isPointerDown = true;
            this.updatePointerPosition(e);
        });

        window.addEventListener('pointerup', () => {
            this.isPointerDown = false;
        });

        window.addEventListener('pointermove', (e: PointerEvent) => {
            if (this.isPointerDown) {
                this.updatePointerPosition(e);
            }
        });
    }

    private updatePointerPosition(event: PointerEvent): void {
        // Calculate pointer position in normalized device coordinates (-1 to +1)
        this.pointerX = (event.clientX / window.innerWidth) * 2 - 1;
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

        if (this.isPointerDown) {
            // Calculate rotation angle based on x-axis distance from center
            // pointerX ranges from -1 (left) to +1 (right)
            // Center is 0, so we use pointerX directly as a rotation factor
            const rotationAmount = -this.pointerX * this.maxRotationSpeed * delta;
            
            // Rotate player around Y-axis (yaw)
            player.rotateY(rotationAmount);

            // Move player forward in their current direction
            const forward = new THREE.Vector3();
            player.getWorldDirection(forward);
            forward.normalize();
            
            const moveDistance = this.moveSpeed * delta;
            const movement = forward.clone().multiplyScalar(moveDistance);
            player.position.add(movement);
        }
    }
}

