import * as THREE from 'three';
import { System } from './system.js';
import { Engine } from '../engine/engine.js';

interface Particle {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    angularVelocity: THREE.Vector3;
    lifetime: number;
    maxLifetime: number;
    active: boolean;
    poolIndex: number;
}

export class ParticleSystem extends System {
    private pool: Particle[] = [];
    private activeParticles: Particle[] = [];
    private freeList: number[] = []; // O(1) spawn: stack of inactive pool indices
    private poolSize: number = 1000;
    private sharedGeometry: THREE.BoxGeometry | null = null;
    // Single shared material instead of 1000 individual ones
    private sharedMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        side: THREE.FrontSide,
    });

    // Line segment endpoints
    private lineStart: THREE.Vector3 = new THREE.Vector3(-1.6, 5.0, 8.1);
    private lineEnd: THREE.Vector3 = new THREE.Vector3(4.3, 5.0, 7.2);

    // Particle properties
    private spawnRate: number = 30; // particles per second
    private spawnTimer: number = 0;
    private particleSpeed: number = 2.0;
    private particleLifetime: number = 1.0;
    private particleSize: number = 0.15;

    // Reusable temporaries — allocated once, never inside update/spawn loops
    private _spawnPoint: THREE.Vector3 = new THREE.Vector3();
    private _rotationAxis: THREE.Vector3 = new THREE.Vector3();
    private _spawnDirection: THREE.Vector3 = new THREE.Vector3();
    private _spawnQuat: THREE.Quaternion = new THREE.Quaternion();
    private _tempVelocity: THREE.Vector3 = new THREE.Vector3();

    constructor(engine: Engine) {
        super(engine);
        this.initializePool();
    }

    private initializePool(): void {
        this.sharedGeometry = new THREE.BoxGeometry(
            this.particleSize,
            this.particleSize,
            this.particleSize
        );

        for (let i = 0; i < this.poolSize; i++) {
            const mesh = new THREE.Mesh(this.sharedGeometry, this.sharedMaterial);
            mesh.visible = false;
            this.engine.scene.add(mesh);

            this.pool.push({
                mesh,
                velocity: new THREE.Vector3(),
                angularVelocity: new THREE.Vector3(),
                lifetime: 0,
                maxLifetime: this.particleLifetime,
                active: false,
                poolIndex: i,
            });
            this.freeList.push(i);
        }
    }

    private getRandomPointOnLine(): THREE.Vector3 {
        this._spawnPoint.lerpVectors(this.lineStart, this.lineEnd, Math.random());
        return this._spawnPoint;
    }

    private getOutwardDirection(): THREE.Vector3 {
        const minAngle = 30 * Math.PI / 180;
        const maxAngle = 90 * Math.PI / 180;
        const angle = minAngle + Math.random() * (maxAngle - minAngle);

        const rotationAngle = Math.random() * Math.PI * 2;
        this._rotationAxis.set(
            Math.cos(rotationAngle),
            Math.sin(rotationAngle),
            0
        ).normalize();

        this._spawnDirection.set(0, 0, 1);
        this._spawnQuat.setFromAxisAngle(this._rotationAxis, angle);
        this._spawnDirection.applyQuaternion(this._spawnQuat).normalize();

        return this._spawnDirection;
    }

    private spawnParticle(): void {
        let particle: Particle;

        if (this.freeList.length > 0) {
            particle = this.pool[this.freeList.pop()!];
        } else if (this.activeParticles.length > 0) {
            // Pool exhausted — reuse oldest active particle
            particle = this.activeParticles[0];
            this.deactivateParticle(particle);
        } else {
            return;
        }

        const spawnPoint = this.getRandomPointOnLine();
        const direction = this.getOutwardDirection();

        particle.mesh.position.copy(spawnPoint);
        particle.velocity.copy(direction).multiplyScalar(this.particleSpeed);
        particle.lifetime = 0;
        particle.maxLifetime = this.particleLifetime;
        particle.active = true;
        particle.mesh.scale.setScalar(1.0);
        particle.mesh.visible = true;

        particle.velocity.x += (Math.random() - 0.5) * 0.5;
        particle.velocity.y += (Math.random() - 0.5) * 0.5;
        particle.velocity.z += (Math.random() - 0.5) * 0.5;

        particle.mesh.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );

        const maxAngularSpeed = 5.0;
        particle.angularVelocity.set(
            (Math.random() - 0.5) * maxAngularSpeed * 2,
            (Math.random() - 0.5) * maxAngularSpeed * 2,
            (Math.random() - 0.5) * maxAngularSpeed * 2
        );

        this.activeParticles.push(particle);
    }

    private deactivateParticle(particle: Particle): void {
        particle.active = false;
        particle.mesh.visible = false;
        this.freeList.push(particle.poolIndex); // O(1) return to pool

        // Swap-and-pop removal from activeParticles — O(1) vs splice's O(n)
        const index = this.activeParticles.indexOf(particle);
        if (index !== -1) {
            this.activeParticles[index] = this.activeParticles[this.activeParticles.length - 1];
            this.activeParticles.pop();
        }
    }

    update(delta: number): void {
        this.spawnTimer += delta;
        const spawnInterval = 1.0 / this.spawnRate;

        while (this.spawnTimer >= spawnInterval) {
            this.spawnParticle();
            this.spawnTimer -= spawnInterval;
        }

        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const particle = this.activeParticles[i];

            // Reuse _tempVelocity instead of allocating a new vector per particle per frame
            this._tempVelocity.copy(particle.velocity).multiplyScalar(delta);
            particle.mesh.position.add(this._tempVelocity);

            particle.mesh.rotation.x += particle.angularVelocity.x * delta;
            particle.mesh.rotation.y += particle.angularVelocity.y * delta;
            particle.mesh.rotation.z += particle.angularVelocity.z * delta;

            particle.lifetime += delta;

            // Scale-based fade: shrinks as lifetime runs out, no per-particle material needed
            const scale = 1.0 - (particle.lifetime / particle.maxLifetime);
            particle.mesh.scale.setScalar(scale);

            if (particle.lifetime >= particle.maxLifetime) {
                this.deactivateParticle(particle);
            }
        }
    }

    dispose(): void {
        for (const particle of this.pool) {
            this.engine.scene.remove(particle.mesh);
        }
        if (this.sharedGeometry) {
            this.sharedGeometry.dispose();
            this.sharedGeometry = null;
        }
        this.sharedMaterial.dispose();
        this.pool = [];
        this.activeParticles = [];
        this.freeList = [];
    }
}
