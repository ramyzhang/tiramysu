import * as THREE from 'three';
import { Engine } from './engine/engine.js';
import { Colours } from './constants.js';
import { EntityRegistry, Player, Tiramysu, Interactable } from './entities/index.js';
import { CameraSystem } from './systems/camera.js';
import { DebugUI } from './systems/debug-ui.js';
import { PlayerMovementSystem } from './systems/player-movement.js';
import { InteractionSystem } from './systems/interaction.js';

export class World {   
    private engine: Engine;
    private scene: THREE.Scene;
    private entityRegistry: EntityRegistry;
    
    private player!: Player;
    private tiramysu!: Tiramysu;
    private cameraSystem!: CameraSystem;
    private debugUI!: DebugUI;
    private playerMovementSystem!: PlayerMovementSystem;
    public interactionSystem!: InteractionSystem;

    constructor(_engine: Engine) {
        this.engine = _engine;
        this.scene = _engine.scene;
        this.entityRegistry = _engine.entityRegistry;
    }

    init(): void {
        this.scene.background = new THREE.Color(Colours.peach); // peach
        
        // -------------- initialize lighting --------------
        const ambientLight = new THREE.AmbientLight(0xffffff, 3.0);
        this.scene.add(ambientLight);
        
        // -------------- initialize entities --------------
        this.player = new Player(this.engine);
        this.entityRegistry.add(this.player);
        
        this.tiramysu = new Tiramysu(this.engine);
        this.entityRegistry.add(this.tiramysu);

        this.entityRegistry.add(new Interactable(new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), new THREE.MeshBasicMaterial({ color: Colours.forestGreen })), new THREE.Vector3(5, 5, -10), 'Interactable'));

        // -------------- initialize camera system --------------
        this.cameraSystem = new CameraSystem(this.engine);
        this.cameraSystem.setPlayer(this.player);

        // -------------- initialize debug UI --------------
        this.debugUI = new DebugUI(this.engine);

        // -------------- initialize player movement system --------------
        this.playerMovementSystem = new PlayerMovementSystem(this.engine);

        // -------------- initialize interaction system --------------
        this.interactionSystem = new InteractionSystem(this.engine);
    }

    update(delta: number): void {
        // Update interaction system first (to set interaction state)
        this.interactionSystem.update(delta);

        // Update player movement system (will check for interactions)
        this.playerMovementSystem.update(delta);

        // Update camera system
        this.cameraSystem.update(delta);

        // Update debug UI
        this.debugUI.update(delta);
    }
}