import * as THREE from 'three';
import { System } from './system.js';
import { Engine } from '../engine/engine.js';
import { Player } from '../entities/player.js';
import { EntityType } from '../entities/entity.js';
import { PlayerSpawnPosition } from '../constants.js';
import { updatePointerPosition } from '../utils/utils.js';

export class PlayerMovementSystem extends System {
    private player: Player | null = null;
    private isPointerDown: boolean = false;
    private isPointerMoving: boolean = false;
    private isJumping: boolean = false;
    private pointerX: number = 0; // Normalized device coordinates (-1 to 1)
    private pointerY: number = 0; // Normalized device coordinates (-1 to 1)
    private maxRotationSpeed: number = 2.0; // Radians per second
    private moveSpeed: number = 5.0; // Units per second

    constructor(engine: Engine) {
        super(engine);
        this.setupInput();
    }

    private setupInput(): void {        
        window.addEventListener('pointerdown', (e: PointerEvent) => {
            // Respond to left mouse button (desktop), or primary touch (touch/mobile)
            if (
                e.pointerType === 'touch' ||
                (e.pointerType === 'mouse' && e.button === 0) // left mouse
            ) {
                this.isPointerDown = true;
                const { pointerX, pointerY } = updatePointerPosition(e);
                this.pointerX = pointerX;
                this.pointerY = pointerY;
            }
        });

        window.addEventListener('pointerup', (e: PointerEvent) => {
            // Respond to left mouse button (desktop), or primary touch (touch/mobile)
            if (
                e.pointerType === 'touch' ||
                (e.pointerType === 'mouse' && e.button === 0) // left mouse
            ) {
                this.isPointerDown = false;
                this.isPointerMoving = false;
            }
        });

        window.addEventListener('pointermove', (e: PointerEvent) => {
            if (this.isPointerDown) {
                this.isPointerMoving = true;
                const { pointerX, pointerY } = updatePointerPosition(e);
                this.pointerX = pointerX;
                this.pointerY = pointerY;
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

    update(delta: number): void {
        const player = this.findPlayer();
        if (!player) return;
    
        if (this.isPointerDown) {
            if (this.pointerY > 0.5 && !this.isPointerMoving) {
                const targetRotation = this.pointerX < 0 ? Math.PI : -Math.PI;
                player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, targetRotation, delta * this.maxRotationSpeed);
            } else {
                const rotationAmount = -this.pointerX * this.maxRotationSpeed * delta;
                player.rotateY(rotationAmount);
            }
    
            // SET VELOCITY instead of directly changing position
            const forward = new THREE.Vector3();
            player.getWorldDirection(forward);
            forward.normalize();
            
            // Set horizontal velocity based on movement direction
            player.velocity.x = forward.x * this.moveSpeed;
            player.velocity.z = forward.z * this.moveSpeed;
            // Don't touch velocity.y - that's handled by physics/gravity
        } else {
            // When not moving, zero out horizontal velocity
            player.velocity.x = 0;
            player.velocity.z = 0;
        }
    
        if (player.position.y < -25) {
            player.position.copy(PlayerSpawnPosition);
            player.velocity.set(0, 0, 0);  // Reset velocity too
        }

        player.updateMatrixWorld();
    }
}

