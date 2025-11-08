// src/engine/Engine.ts
import * as THREE from 'three';
import { World } from '../world.js';
import { InputManager } from './input.js';
import { EntityRegistry } from '../entities/entity-registry.js';
// import { AudioManager } from '../audio/audio.js';
// import { UI } from '../ui/UI';
import { Physics } from './physics.js';
import { ResourceManager } from './resources.js';
// import { EventBus } from '../utils/EventBus';

export class Engine {
    private renderer: THREE.WebGLRenderer;

    public scene: THREE.Scene;
    public world: World;

    public entityRegistry: EntityRegistry;

    public camera: THREE.PerspectiveCamera;
    public clock: THREE.Clock;
    
    private isFocused: boolean = true;

    public resources: ResourceManager;
    public input: InputManager;
    //   public audio: AudioManager;
    public physics: Physics;
    //   public events: EventBus;
    //   public ui: UI;

    constructor(canvas: HTMLCanvasElement) {
        // Initialize core Three.js components
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75, // fov
            window.innerWidth / window.innerHeight, // aspect ratio
            0.1, // near clipping plane
            1000 // far clipping plane
        );
        this.camera.layers.enableAll();
        this.renderer = new THREE.WebGLRenderer({ canvas });
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.clock = new THREE.Clock();

        // Initialize systems
        // this.events = new EventBus();
        this.resources = new ResourceManager();
        // this.audio = new AudioManager();
        // this.ui = new UI(this);

        this.entityRegistry = new EntityRegistry(this);
        this.world = new World(this);
        this.physics = new Physics(this);
        this.input = new InputManager(this);

        // Handle resizing
        window.addEventListener('resize', () => this.onResize());
        
        // Handle window focus
        window.addEventListener('blur', () => {
            this.isFocused = false;
            this.clock.stop();
        });
        
        window.addEventListener('focus', () => {
            this.isFocused = true;
            this.clock.start();
        });
    }

    async init(): Promise<void> {
        await this.resources.loadEssentialAssets();

        this.input.init();
        this.world.init();

        // Start the animation loop
        this.clock.start();
        this.update();
    }

    private update(): void {
        if (!this.isFocused) {
            // Pause updates when window is unfocused, but still render
            requestAnimationFrame(() => this.update());
            return;
        }

        const delta = this.clock.getDelta();

        // update systems
        this.input.update();
        this.world.update(delta);

        this.physics.update(delta);
        // this.ui.update(delta);
        
        // render
        this.renderer.render(this.scene, this.camera);

        // continue loop
        requestAnimationFrame(() => this.update());
    }

    private onResize(): void {
        // Handle window resize
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}