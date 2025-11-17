// src/engine/Engine.ts
import * as THREE from 'three';
import { World } from '../world.js';
import { EntityRegistry } from '../entities/entity-registry.js';
import { Physics } from './physics.js';
import { ResourceManager } from './resources.js';
import { InputManager } from './input.js';

export class Engine {
    private renderer: THREE.WebGLRenderer;

    public scene: THREE.Scene;
    public world: World;

    public entityRegistry: EntityRegistry;

    public camera: THREE.PerspectiveCamera;
    public clock: THREE.Clock;

    public resources: ResourceManager;
    public physics: Physics;
    public input: InputManager;

    constructor(canvas: HTMLCanvasElement) {
        // Initialize core Three.js components
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            50, // fov
            window.innerWidth / window.innerHeight, // aspect ratio
            0.1, // near clipping plane
            1000 // far clipping plane
        );
        this.camera.layers.enableAll();
        this.renderer = new THREE.WebGLRenderer({ canvas });
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.clock = new THREE.Clock();

        // Initialize systems
        this.resources = new ResourceManager();
        this.input = new InputManager();
        this.entityRegistry = new EntityRegistry(this);
        this.world = new World(this);
        this.physics = new Physics(this);

        // Handle window resize (InputManager tracks size, but we need to update camera/renderer)
        window.addEventListener('resize', () => this.onResize());
        
        // Handle window focus (InputManager tracks focus, but we need to control clock)
        window.addEventListener('blur', () => {
            this.clock.stop();
        });
        
        window.addEventListener('focus', () => {
            this.clock.start();
        });
    }

    async init(): Promise<void> {
        await this.resources.loadEssentialAssets();

        this.world.init();
        this.physics.init(); // must be after world.init() so that environment meshes are loaded

        // Start the animation loop
        this.clock.start();
        this.update();
    }

    private update(): void {
        if (!this.input.isFocused) {
            // Pause updates when window is unfocused, but still render
            requestAnimationFrame(() => this.update());
            return;
        }

        const delta = this.clock.getDelta();

        // update systems
        this.world.update(delta);
        this.physics.update(delta);
        
        // render
        this.renderer.render(this.scene, this.camera);

        // continue loop
        requestAnimationFrame(() => this.update());
    }

    private onResize(): void {
        // Handle window resize
        this.camera.aspect = this.input.windowWidth / this.input.windowHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.input.windowWidth, this.input.windowHeight);
    }
}