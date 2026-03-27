import * as THREE from 'three';
import { System } from './system.js';
import { Engine } from '../engine/engine.js';
import { Player } from '../entities/player.js';
import { PlayerSpawnPosition, GlobalUp } from '../constants.js';

export class PlayerMovementSystem extends System {
    private player: Player;
    private moveSpeed: number = 8.0; // Units per second
    private acceleration: number = 12.0; // Higher = snappier, lower = floatier
    private cameraDirection: THREE.Vector3 = new THREE.Vector3();

    private inputDirection: THREE.Vector2 = new THREE.Vector2();

    private tempVecA: THREE.Vector3 = new THREE.Vector3();
    private targetVelocity: THREE.Vector3 = new THREE.Vector3();

    constructor(engine: Engine, player: Player) {
        super(engine);
        this.player = player;
        this.engine.camera.getWorldDirection(this.cameraDirection);
    }

    update(delta: number): void {
        if (!this.player.velocity)
            return;

        const input = this.engine.input;
        this.inputDirection.copy(input.pointerPosition);

        this.engine.camera.getWorldDirection(this.cameraDirection);
        this.cameraDirection.y = 0;
        this.cameraDirection.normalize();

        // Check if player is interacting or dialogue is active - if so, don't process movement
        const interactionSystem = this.engine.world.interactionSystem;
        const dialogueSystem = this.engine.world.dialogueSystem;
        
        if ((interactionSystem && interactionSystem.isCurrentlyInteracting()) ||
            (dialogueSystem && dialogueSystem.isActive())) {
            // player is interacting or in dialogue, don't process movement
            this.player.velocity.set(0, 0, 0);
            return;
        }

        if (input.pointerDown) {
            let desiredLocalCameraAngle = Math.atan2(this.inputDirection.y, this.inputDirection.x);

            // get the right vector of the camera
            this.tempVecA = this.cameraDirection.clone().cross(GlobalUp);
            const newDir = this.tempVecA;

            newDir.applyAxisAngle(GlobalUp, desiredLocalCameraAngle);
            newDir.normalize();

            // normalize to [0, 2π]
            if (desiredLocalCameraAngle < 0) {
                desiredLocalCameraAngle += 2 * Math.PI;
            }

            this.player.lookAt(this.player.position.clone().add(newDir));

            this.targetVelocity.set(newDir.x * this.moveSpeed, 0, newDir.z * this.moveSpeed);
        } else {
            this.targetVelocity.set(0, 0, 0);
        }

        // Lerp horizontal velocity toward target (leave Y alone — owned by physics)
        const t = 1 - Math.exp(-this.acceleration * delta);
        this.player.velocity.x += (this.targetVelocity.x - this.player.velocity.x) * t;
        this.player.velocity.z += (this.targetVelocity.z - this.player.velocity.z) * t;

        if (this.player.position.y < -25) {
            this.player.position.copy(PlayerSpawnPosition);
            if (this.player.velocity) {
                this.player.velocity.set(0, 0, 0);  // Reset velocity too
            }
        }
    }
}

