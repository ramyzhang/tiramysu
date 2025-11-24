import * as THREE from 'three';
import { Engine } from './engine/engine.js';
import { Colours, Layers } from './constants.js';
import { EntityRegistry, Player, Tiramysu, NPC, Interactable } from './entities/index.js';
import { CameraSystem } from './systems/camera.js';
import { DebugUI } from './systems/debug-ui.js';
import { PlayerMovementSystem } from './systems/player-movement.js';
import { InteractionSystem } from './systems/interaction.js';
import { DialogueSystem } from './systems/dialogue.js';
import { CameraOcclusionSystem } from './systems/camera-occlusion.js';

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
    public dialogueSystem!: DialogueSystem;
    private cameraOcclusionSystem!: CameraOcclusionSystem;

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

        // Add NPC with lazy loading - load mesh in background (don't block initialization)
        const liltao = new NPC(this.engine, '/models/tiramysu-liltao.glb', new THREE.Vector3(0, 5, -10), 'LilTao');
        this.entityRegistry.add(liltao);
        this.engine.resources.loadMeshIntoEntity(liltao, '/models/tiramysu-liltao.glb', Layers.NPC).catch((error) => {
            console.error('Failed to load Liltao mesh:', error);
        });
 
        // -------------- initialize systems --------------
        this.cameraSystem = new CameraSystem(this.engine);
        this.cameraSystem.setPlayer(this.player);

        this.debugUI = new DebugUI(this.engine);

        this.playerMovementSystem = new PlayerMovementSystem(this.engine);

        this.interactionSystem = new InteractionSystem(this.engine);

        this.dialogueSystem = new DialogueSystem(this.engine);

        this.cameraOcclusionSystem = new CameraOcclusionSystem(this.engine);
        this.cameraOcclusionSystem.init();
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

        // Update dialogue system
        this.dialogueSystem.update(delta);

        // Update camera occlusion system (after camera update to use latest positions)
        this.cameraOcclusionSystem.update(delta);
    }

    dispose(): void {
        this.cameraOcclusionSystem.dispose();
    }
}