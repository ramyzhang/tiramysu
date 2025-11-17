import * as THREE from 'three';
import { Engine } from './engine/engine.js';
import { Colours } from './constants.js';
import { EntityRegistry } from './entities/entity-registry.js';
import { Player } from './entities/player.js';
import { Tiramysu } from './entities/tiramysu.js';
import { CameraSystem } from './systems/camera.js';
import { DebugUI } from './systems/debug-ui.js';
import { PlayerMovementSystem } from './systems/player-movement.js';

export class World {   
    private engine: Engine;
    private scene: THREE.Scene;
    private entityRegistry: EntityRegistry;
    
    private player!: Player;
    private tiramysu!: Tiramysu;
    private cameraSystem!: CameraSystem;
    private debugUI!: DebugUI;
    private playerMovementSystem!: PlayerMovementSystem;

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
        this.player = new Player();
        this.entityRegistry.add(this.player);
        
        this.tiramysu = new Tiramysu(this.engine);
        this.entityRegistry.add(this.tiramysu);

        // -------------- initialize camera system --------------
        this.cameraSystem = new CameraSystem(this.engine);
        this.cameraSystem.setPlayer(this.player);

        // -------------- initialize debug UI --------------
        this.debugUI = new DebugUI(this.engine);

        // -------------- initialize player movement system --------------
        this.playerMovementSystem = new PlayerMovementSystem(this.engine);
    }

    update(delta: number): void {
        // Update player movement system
        this.playerMovementSystem.update(delta);

        // Update camera system
        this.cameraSystem.update(delta);

        // Update debug UI
        this.debugUI.update(delta);
    }
}