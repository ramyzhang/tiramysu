import * as THREE from 'three';
import { System } from './system.js';
import { Engine } from '../engine/engine.js';
import { Player } from '../entities/player.js';
import { PlayerSpawnDirection, PlayerSpawnPosition } from '../constants.js';
import { lerp } from 'three/src/math/MathUtils.js';

export enum CameraMode {
    Player = 'player',
    Free = 'free'
}

export class CameraSystem extends System {
    private player: Player | null = null;
    private currentMode: CameraMode = CameraMode.Free;
    private playerDirection: THREE.Vector3 = new THREE.Vector3();

    // Player camera settings
    private readonly cameraHeight = 1.5;
    private readonly cameraDistance = 5;
    private readonly cameraResetSpeed = 0.3;
    private readonly cameraFollowSpeed = 3;
    private cameraRotationY = 0;
    
    // Free camera settings
    private freeCameraSpeed = 10.0;
    private freeCameraPanSpeed = 2.0; // Rotation speed for Q/E panning
    private freeCameraPosition = new THREE.Vector3(-22, 10, -14);
    private freeCameraRotationY = 0;
    private lastCKeyState: boolean = false;

    private tempVecA: THREE.Vector3 = new THREE.Vector3();
    private tempVecB: THREE.Vector3 = new THREE.Vector3();

    constructor(engine: Engine) {
        super(engine);
        this.engine.camera.position.copy(PlayerSpawnPosition.clone().sub(PlayerSpawnDirection.clone().multiplyScalar(this.cameraDistance)));
    }

    setPlayer(player: Player): void {
        this.player = player;
    }

    toggleMode(): void {
        this.currentMode = this.currentMode === CameraMode.Player 
            ? CameraMode.Free 
            : CameraMode.Player;
        
        if (this.currentMode === CameraMode.Free) {
            // Initialize free camera at current camera position
            this.freeCameraPosition.copy(this.engine.camera.position);
            // Extract yaw from world direction so pitch/roll from lookAt() don't bleed in
            const dir = this.tempVecA;
            this.engine.camera.getWorldDirection(dir);
            this.freeCameraRotationY = Math.atan2(-dir.x, -dir.z);
        }
    }

    update(delta: number): void {
        // Check for camera mode toggle (C key)
        const input = this.engine.input;
        const cKeyPressed = input.isKeyPressed('c');
        if (cKeyPressed && !this.lastCKeyState) {
            // Key just pressed (not held)
            this.toggleMode();
        }
        this.lastCKeyState = cKeyPressed;

        if (this.currentMode === CameraMode.Player) {
            this.updatePlayerCamera(delta);
        } else {
            this.updateFreeCamera(delta);
        }
    }

    private updatePlayerCamera(delta: number): void {
        if (!this.player) return;
        
        this.player.getWorldDirection(this.playerDirection);
        const playerRotationY =  Math.atan2(-this.playerDirection.x, -this.playerDirection.z);
        
        // Only reset camera angle toward player when there's no movement input
        const rotateT = 1 - Math.exp(-this.cameraResetSpeed * delta);
        this.cameraRotationY = lerp(this.cameraRotationY, playerRotationY, rotateT);

        const newPosition = this.tempVecA;
        newPosition.copy(this.player.position);
        newPosition.x += Math.sin(this.cameraRotationY) * this.cameraDistance;
        newPosition.y += this.cameraHeight;
        newPosition.z += Math.cos(this.cameraRotationY) * this.cameraDistance;

        const followT = 1 - Math.exp(-this.cameraFollowSpeed * delta);
        this.engine.camera.position.lerp(newPosition, followT);
        this.engine.camera.lookAt(this.player.position);
    }

    private updateFreeCamera(delta: number): void {
        const input = this.engine.input;

        // Only allow Q/E to rotate around world Y-axis (yaw)
        // Store yaw only in freeCameraRotation.y
        if (input.isKeyPressed('q')) {
            // Rotate positively around world Y
            this.freeCameraRotationY += this.freeCameraPanSpeed * delta;
        }
        if (input.isKeyPressed('e')) {
            // Rotate negatively around world Y
            this.freeCameraRotationY -= this.freeCameraPanSpeed * delta;
        }

        // Calculate forward and right vectors strictly from yaw (Y axis)
        const moveVector = new THREE.Vector3();
        const yaw = this.freeCameraRotationY;
        const up = new THREE.Vector3(0, 1, 0);

        // Forward and right in XZ plane based only on yaw
        const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
        const right = new THREE.Vector3(-Math.cos(yaw), 0, Math.sin(yaw));

        // Movement
        let moveSpeed = this.freeCameraSpeed;
        if (input.isKeyPressed('shift')) moveSpeed *= 2; // Fast mode with Shift

        if (input.isKeyPressed('w')) moveVector.sub(forward);
        if (input.isKeyPressed('s')) moveVector.add(forward);
        if (input.isKeyPressed('a')) moveVector.sub(right);
        if (input.isKeyPressed('d')) moveVector.add(right);
        if (input.isKeyPressed(' ')) moveVector.add(up); // Space to go up
        if (input.isKeyPressed('shift') && !input.isKeyPressed('w') && !input.isKeyPressed('s') && !input.isKeyPressed('a') && !input.isKeyPressed('d')) {
            moveVector.sub(up); // Shift alone to go down
        }

        if (moveVector.length() > 0) {
            moveVector.normalize().multiplyScalar(moveSpeed * delta);
            this.freeCameraPosition.add(moveVector);
        }

        this.engine.camera.rotation.copy(new THREE.Euler(0, this.freeCameraRotationY, 0));
        this.engine.camera.position.copy(this.freeCameraPosition);
    }
}

