// src/engine/Engine.ts
import * as THREE from 'three';
import { World } from '../world.js';
import { EntityRegistry } from '../entities/entity-registry.js';
import { Physics } from './physics.js';
import { ResourceManager } from './resources.js';
import { InputManager } from './input.js';
import { Layers } from '../constants.js';

export class Engine {
    private renderer: THREE.WebGLRenderer;
    private renderTarget: THREE.WebGLRenderTarget | null = null;
    private pixelationScale: number = 0.5; // Lower = more pixelated (0.25 = very pixelated, 1.0 = no pixelation)
    private screenQuad: THREE.Mesh | null = null;
    private screenScene: THREE.Scene | null = null;
    private screenCamera: THREE.OrthographicCamera | null = null;

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

        // Setup pixelation rendering
        this.setupPixelation(canvas);

        this.clock = new THREE.Clock();

        // Initialize systems
        this.resources = new ResourceManager();
        this.input = new InputManager();
        this.entityRegistry = new EntityRegistry(this);
        this.world = new World(this);
        this.physics = new Physics(this);

        // Handle window resize
        window.addEventListener('resize', () => this.onResize());
        
        // Handle window focus
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
            // wait 100ms before updating again
            setTimeout(() => {
                requestAnimationFrame(() => this.update());
            }, 100);
            return;
        }

        const delta = this.clock.getDelta();

        // update systems
        this.world.update(delta);
        this.physics.update(delta);
        
        // render to pixelated render target
        if (this.renderTarget && this.screenQuad) {
            // Render main scene to render target
            this.renderer.setRenderTarget(this.renderTarget);
            this.renderer.render(this.scene, this.camera);
            
            // Render screen quad to canvas
            this.renderer.setRenderTarget(null);
            this.renderer.render(this.screenScene!, this.screenCamera!);
        } else {
            // Fallback: render directly to canvas
            this.renderer.render(this.scene, this.camera);
        }

        // continue loop
        requestAnimationFrame(() => this.update());
    }

    dispose(): void {
        this.world.dispose();
        this.world = null!;
        this.physics = null!;
        this.input = null!;
        this.entityRegistry = null!;
    }

    /**
     * Sets up pixelation rendering by creating a lower resolution render target
     * and a screen quad to display it with nearest-neighbor filtering.
     */
    private setupPixelation(canvas: HTMLCanvasElement): void {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Create render target at lower resolution
        const pixelWidth = Math.floor(width * this.pixelationScale);
        const pixelHeight = Math.floor(height * this.pixelationScale);
        
        this.renderTarget = new THREE.WebGLRenderTarget(pixelWidth, pixelHeight, {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat
        });

        // Create screen scene and camera for rendering the quad
        this.screenScene = new THREE.Scene();
        this.screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        // Create screen quad material
        const screenMaterial = new THREE.MeshBasicMaterial({
            map: this.renderTarget.texture,
            side: THREE.DoubleSide
        });

        // Create screen quad geometry
        const screenGeometry = new THREE.PlaneGeometry(2, 2);
        this.screenQuad = new THREE.Mesh(screenGeometry, screenMaterial);
        this.screenScene.add(this.screenQuad);

        // Set canvas CSS to use nearest-neighbor for extra pixelation
        canvas.style.imageRendering = 'pixelated';
        canvas.style.imageRendering = '-moz-crisp-edges';
        canvas.style.imageRendering = 'crisp-edges';
    }

    /**
     * Sets the pixelation scale (0.0 to 1.0).
     * Lower values = more pixelated (e.g., 0.25 = very pixelated, 1.0 = no pixelation)
     */
    public setPixelationScale(scale: number): void {
        this.pixelationScale = Math.max(0.1, Math.min(1.0, scale));
        this.updateRenderTargetSize();
    }

    /**
     * Gets the current pixelation scale.
     */
    public getPixelationScale(): number {
        return this.pixelationScale;
    }

    /**
     * Updates the render target size when window is resized.
     */
    private updateRenderTargetSize(): void {
        if (!this.renderTarget) return;
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        const pixelWidth = Math.floor(width * this.pixelationScale);
        const pixelHeight = Math.floor(height * this.pixelationScale);
        
        this.renderTarget.setSize(pixelWidth, pixelHeight);
    }

    private onResize(): void {
        // Handle window resize
        this.camera.aspect = this.input.windowWidth / this.input.windowHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.input.windowWidth, this.input.windowHeight);
        
        // Update render target size for pixelation
        this.updateRenderTargetSize();
    }
}