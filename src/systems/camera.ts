import * as THREE from 'three';
import { System } from './system.js';
import { Engine } from '../engine/engine.js';
import { Player } from '../entities/player.js';
import { degToRad } from 'three/src/math/MathUtils.js';

export enum CameraMode {
    Player = 'player',
    Free = 'free'
}

export class CameraSystem extends System {
    private player: Player | null = null;
    private currentMode: CameraMode = CameraMode.Player;
    
    // Player camera settings
    private cameraAngle = degToRad(30);
    private cameraDistance = 20;
    
    // Free camera settings
    private freeCameraSpeed = 10.0;
    private freeCameraPanSpeed = 2.0; // Rotation speed for Q/E panning
    private freeCameraPosition = new THREE.Vector3(0, 10, 10);
    private freeCameraRotation = new THREE.Euler(0, 0, 0);
    private keys: { [key: string]: boolean } = {};

    constructor(engine: Engine) {
        super(engine);
        this.setupInput();
    }

    setPlayer(player: Player): void {
        this.player = player;
    }

    private setupInput(): void {
        // Track keyboard state
        window.addEventListener('keydown', (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            
            // Toggle camera mode with 'C'
            if (key === 'c') {
                this.toggleMode();
            }
        });

        window.addEventListener('keyup', (e: KeyboardEvent) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    toggleMode(): void {
        this.currentMode = this.currentMode === CameraMode.Player 
            ? CameraMode.Free 
            : CameraMode.Player;
        
        if (this.currentMode === CameraMode.Free) {
            // Initialize free camera at current camera position
            this.freeCameraPosition.copy(this.engine.camera.position);
            const euler = new THREE.Euler().setFromQuaternion(this.engine.camera.quaternion);
            this.freeCameraRotation.copy(euler);
        }
        
        console.log('Camera mode:', this.currentMode);
    }

    update(delta: number): void {
        if (this.currentMode === CameraMode.Player) {
            this.updatePlayerCamera(delta);
        } else {
            this.updateFreeCamera(delta);
        }
    }

    private updatePlayerCamera(delta: number): void {
        if (!this.player) return;

        // Always have the camera be behind the player at a 30 degree elevation
        const forward = new THREE.Vector3();
        this.player.getWorldDirection(forward);   
        forward.normalize();
        
        const horizontalDist = this.cameraDistance * Math.cos(this.cameraAngle);
        const verticalDist = this.cameraDistance * Math.sin(this.cameraAngle);
        
        const cameraOffset = forward.clone().multiplyScalar(-horizontalDist);
        cameraOffset.y = verticalDist;
        
        this.engine.camera.position.copy(this.player.position).add(cameraOffset);
        this.engine.camera.lookAt(this.player.position);
    }

    private updateFreeCamera(delta: number): void {
        // Q/E panning (horizontal rotation)
        if (this.keys['q']) {
            this.freeCameraRotation.y += this.freeCameraPanSpeed * delta;
        }
        if (this.keys['e']) {
            this.freeCameraRotation.y -= this.freeCameraPanSpeed * delta;
        }

        // WASD movement
        const moveVector = new THREE.Vector3();
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);

        // Calculate forward/right vectors from rotation
        forward.set(
            Math.sin(this.freeCameraRotation.y),
            0,
            Math.cos(this.freeCameraRotation.y)
        );
        right.crossVectors(forward, up).normalize();

        // Movement
        let moveSpeed = this.freeCameraSpeed;
        if (this.keys['shift']) moveSpeed *= 2; // Fast mode with Shift

        if (this.keys['w']) moveVector.add(forward);
        if (this.keys['s']) moveVector.sub(forward);
        if (this.keys['a']) moveVector.sub(right);
        if (this.keys['d']) moveVector.add(right);
        if (this.keys[' ']) moveVector.add(up); // Space to go up
        if (this.keys['shift'] && !this.keys['w'] && !this.keys['s'] && !this.keys['a'] && !this.keys['d']) {
            moveVector.sub(up); // Shift alone to go down
        }

        if (moveVector.length() > 0) {
            moveVector.normalize().multiplyScalar(moveSpeed * delta);
            this.freeCameraPosition.add(moveVector);
        }

        // Apply rotation and position
        this.engine.camera.rotation.copy(this.freeCameraRotation);
        this.engine.camera.position.copy(this.freeCameraPosition);
    }
}

