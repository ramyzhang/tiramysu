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
}

export class ParticleSystem extends System {
    private pool: Particle[] = [];
    private activeParticles: Particle[] = [];
    private poolSize: number = 1000;
    private sharedGeometry: THREE.BoxGeometry | null = null;
    
    // Line segment endpoints
    private lineStart: THREE.Vector3 = new THREE.Vector3(-1.6, 5.0, 8.1);
    private lineEnd: THREE.Vector3 = new THREE.Vector3(4.3, 5.0, 7.2);
    
    // Particle properties
    private spawnRate: number = 30; // particles per second
    private spawnTimer: number = 0;
    private particleSpeed: number = 2.0;
    private particleLifetime: number = 1.0;
    private particleSize: number = 0.15;
    
    constructor(engine: Engine) {
        super(engine);
        this.initializePool();
    }
    
    private initializePool(): void {
        // Share geometry across all particles for better performance
        this.sharedGeometry = new THREE.BoxGeometry(
            this.particleSize,
            this.particleSize,
            this.particleSize
        );
        
        for (let i = 0; i < this.poolSize; i++) {
            // Each particle needs its own material for independent opacity control
            const material = new THREE.MeshBasicMaterial({ 
                color: 0xffffff,
                opacity: 1.0,
                side: THREE.DoubleSide
            });
            
            const mesh = new THREE.Mesh(this.sharedGeometry, material);
            mesh.visible = false;
            this.engine.scene.add(mesh);
            
            this.pool.push({
                mesh,
                velocity: new THREE.Vector3(),
                angularVelocity: new THREE.Vector3(),
                lifetime: 0,
                maxLifetime: this.particleLifetime,
                active: false
            });
        }
    }
    
    private getRandomPointOnLine(): THREE.Vector3 {
        const t = Math.random(); // Random value between 0 and 1
        const point = new THREE.Vector3();
        point.lerpVectors(this.lineStart, this.lineEnd, t);
        return point;
    }
    
    private getOutwardDirection(spawnPoint: THREE.Vector3): THREE.Vector3 {
        // Start with positive Z axis direction
        const baseDirection = new THREE.Vector3(0, 0, 1);
        
        // Random angle between 10 and 80 degrees
        const minAngle = 30 * Math.PI / 180;
        const maxAngle = 90 * Math.PI / 180;
        const angle = minAngle + Math.random() * (maxAngle - minAngle);
        
        // Random rotation direction around Z axis (in XY plane)
        const rotationAngle = Math.random() * Math.PI * 2;
        const rotationAxis = new THREE.Vector3(
            Math.cos(rotationAngle),
            Math.sin(rotationAngle),
            0
        ).normalize();
        
        // Rotate the base direction by the angle around the rotation axis
        const direction = new THREE.Vector3();
        direction.copy(baseDirection);
        
        // Create rotation quaternion
        const quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(rotationAxis, angle);
        direction.applyQuaternion(quaternion);
        
        return direction.normalize();
    }
    
    private spawnParticle(): void {
        // Find an inactive particle from the pool
        let particle = this.pool.find(p => !p.active);
        
        if (!particle) {
            // Pool exhausted, reuse the oldest active particle
            if (this.activeParticles.length > 0) {
                particle = this.activeParticles[0];
                this.deactivateParticle(particle);
            } else {
                return; // No particles available
            }
        }
        
        // Spawn at random point on line
        const spawnPoint = this.getRandomPointOnLine();
        const direction = this.getOutwardDirection(spawnPoint);
        
        // Initialize particle
        particle.mesh.position.copy(spawnPoint);
        particle.velocity.copy(direction).multiplyScalar(this.particleSpeed);
        particle.lifetime = 0;
        particle.maxLifetime = this.particleLifetime;
        particle.active = true;
        particle.mesh.visible = true;
        
        // Add random velocity variation
        particle.velocity.x += (Math.random() - 0.5) * 0.5;
        particle.velocity.y += (Math.random() - 0.5) * 0.5;
        particle.velocity.z += (Math.random() - 0.5) * 0.5;
        
        // Set random initial rotation
        particle.mesh.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );
        
        // Set random angular velocity (rotation speed)
        const maxAngularSpeed = 5.0; // radians per second
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
        const index = this.activeParticles.indexOf(particle);
        if (index > -1) {
            this.activeParticles.splice(index, 1);
        }
    }
    
    update(delta: number): void {
        // Spawn new particles
        this.spawnTimer += delta;
        const spawnInterval = 1.0 / this.spawnRate;
        
        while (this.spawnTimer >= spawnInterval) {
            this.spawnParticle();
            this.spawnTimer -= spawnInterval;
        }
        
        // Update active particles
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const particle = this.activeParticles[i];
            
            // Update position
            particle.mesh.position.add(
                particle.velocity.clone().multiplyScalar(delta)
            );
            
            // Update rotation
            particle.mesh.rotation.x += particle.angularVelocity.x * delta;
            particle.mesh.rotation.y += particle.angularVelocity.y * delta;
            particle.mesh.rotation.z += particle.angularVelocity.z * delta;
            
            // Update lifetime
            particle.lifetime += delta;
            
            // Fade out as particle ages
            const alpha = 1.0 - (particle.lifetime / particle.maxLifetime);
            if (particle.mesh.material instanceof THREE.MeshBasicMaterial) {
                particle.mesh.material.opacity = alpha;
            }
            
            // Deactivate if lifetime expired
            if (particle.lifetime >= particle.maxLifetime) {
                this.deactivateParticle(particle);
            }
        }
    }
    
    dispose(): void {
        // Clean up all particles
        for (const particle of this.pool) {
            this.engine.scene.remove(particle.mesh);
            if (particle.mesh.material instanceof THREE.Material) {
                particle.mesh.material.dispose();
            }
        }
        // Dispose shared geometry once
        if (this.sharedGeometry) {
            this.sharedGeometry.dispose();
            this.sharedGeometry = null;
        }
        this.pool = [];
        this.activeParticles = [];
    }
}

