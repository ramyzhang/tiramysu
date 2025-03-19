// src/engine/Engine.ts
import * as THREE from 'three';
import { World } from '../world.js';
import { EntityRegistry } from '../entities/entity-registry.js';
// import { Player } from '../characters/player.js';
// import { InputManager } from './input.js';
// import { ResourceManager } from './resources.js';
// import { AudioManager } from '../audio/audio.js';
// import { UI } from '../ui/UI';
// import { Physics } from './physics.js';
// import { EventBus } from '../utils/EventBus';

export class Engine {
    private renderer: THREE.WebGLRenderer;

    public scene: THREE.Scene;
    public world: World;

    public entityRegistry: EntityRegistry;

    public camera: THREE.PerspectiveCamera;
    public clock: THREE.Clock;

    //   public resources: ResourceManager;
    //   public input: InputManager;
    //   public audio: AudioManager;
    //   public physics: Physics;
    //   public events: EventBus;
    //   public ui: UI;

    //   public player: Player;

    constructor(canvas: HTMLCanvasElement) {
        // Initialize core Three.js components
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75, // fov
            window.innerWidth / window.innerHeight, // aspect ratio
            0.1, // near clipping plane
            1000 // far clipping plane
        );
        this.renderer = new THREE.WebGLRenderer({ canvas });
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.clock = new THREE.Clock();

        // Initialize systems
        // this.events = new EventBus();
        // this.resources = new ResourceManager();
        // this.input = new InputManager(this);
        // this.audio = new AudioManager();
        // this.physics = new Physics();
        // this.ui = new UI(this);

        // Handle resizing
        window.addEventListener('resize', () => this.onResize());
        document.body.appendChild(this.renderer.domElement);

        this.entityRegistry = new EntityRegistry(this);
        this.world = new World(this);
    }

    async init(): Promise<void> {
        // Load essential resources
        // await this.resources.loadEssentialAssets();

        // initialize world
        this.world.init();

        // Initialize player
        // this.player = new Player(this);
        // this.scene.add(this.player.model);

        // Start the animation loop
        this.clock.start();
        this.update();
    }

    private update(): void {
        const delta = this.clock.getDelta();

        // Update systems
        // this.input.update();
        // this.player.update(delta);
        if (this.world) {
            this.world.update(delta);
        }
        // this.physics.update();
        // this.ui.update(delta);

        // Render
        this.renderer.render(this.scene, this.camera);

        // Continue loop
        requestAnimationFrame(() => this.update());
    }

    private onResize(): void {
        // Handle window resize
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}