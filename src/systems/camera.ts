import * as THREE from 'three';
import { System } from './system.js';
import { Engine } from '../engine/engine.js';
import { Player } from '../entities/player.js';
import { PlayerSpawnDirection, PlayerSpawnPosition } from '../constants.js';

export enum CameraMode {
    Player = 'player',
    Free = 'free'
}

export class CameraSystem extends System {
    private player: Player | null = null;
    private currentMode: CameraMode = CameraMode.Player;
    private playerDirection: THREE.Vector3 = new THREE.Vector3();
    private cameraPosition: THREE.Vector3 = new THREE.Vector3();
    private cameraDirection: THREE.Vector3 = new THREE.Vector3();

    // Player camera settings
    private readonly cameraHeight = 3;
    private readonly cameraDistance = 10;
    private readonly cameraResetSpeed = 0.5;
    
    // Free camera settings
    private freeCameraSpeed = 10.0;
    private freeCameraPanSpeed = 2.0; // Rotation speed for Q/E panning
    private freeCameraPosition = new THREE.Vector3(0, 10, 10);
    private freeCameraRotationY = 0;
    private lastCKeyState: boolean = false;

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
            this.freeCameraRotationY = this.engine.camera.rotation.y;
        }
        
        console.log('Camera mode:', this.currentMode);
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
        
        this.cameraPosition.copy(this.engine.camera.position);
        this.engine.camera.getWorldDirection(this.cameraDirection);
        this.player.getWorldDirection(this.playerDirection);
        
        const newPosition = this.player.position.clone().sub(this.playerDirection.clone().multiplyScalar(this.cameraDistance));
        newPosition.y += this.cameraHeight;

        this.engine.camera.position.copy(this.player.position.clone().sub(this.cameraDirection.clone().multiplyScalar(this.cameraDistance)));
        this.engine.camera.position.y = this.player.position.y + this.cameraHeight;
        this.engine.camera.position.lerp(newPosition, delta * this.cameraResetSpeed);
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

        // Apply only yaw rotation to camera (no pitch/roll for Q/E, so x and z are unchanged)
        this.engine.camera.rotation.set(0, this.freeCameraRotationY, 0);
        this.engine.camera.position.copy(this.freeCameraPosition);
    }
}

