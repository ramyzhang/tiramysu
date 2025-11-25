import * as THREE from 'three';
import { Engine } from './engine/engine.js';
import { Colours, Layers, LilTaoDialogueBubbleOffset } from './constants.js';
import { EntityRegistry, Player, Tiramysu, NPC, Prop } from './entities/index.js';
import { CameraSystem } from './systems/camera.js';
import { DebugUI } from './systems/debug-ui.js';
import { PlayerMovementSystem, InteractionSystem, DialogueSystem, CameraOcclusionSystem, NPCMovementSystem } from './systems/index.js';
import { LilTaoSpawnPosition } from './constants.js';

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
    private npcMovementSystem!: NPCMovementSystem;

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
        this.spawn();
 
        // -------------- initialize systems --------------
        this.cameraSystem = new CameraSystem(this.engine);
        this.cameraSystem.setPlayer(this.player);

        this.debugUI = new DebugUI(this.engine);
        this.playerMovementSystem = new PlayerMovementSystem(this.engine);
        this.interactionSystem = new InteractionSystem(this.engine);
        this.dialogueSystem = new DialogueSystem(this.engine);
        this.npcMovementSystem = new NPCMovementSystem(this.engine);

        this.cameraOcclusionSystem = new CameraOcclusionSystem(this.engine);
        this.cameraOcclusionSystem.init();
    }

    update(delta: number): void {
        if (!this.dialogueSystem.isActive()) {
            this.interactionSystem.update(delta);
            this.playerMovementSystem.update(delta);
        }

        this.npcMovementSystem.update(delta);
        this.cameraSystem.update(delta);
        this.debugUI.update(delta);
        this.cameraOcclusionSystem.update(delta);
    }

    spawn(): void {
        this.player = new Player(this.engine);
        this.entityRegistry.add(this.player);
        
        this.tiramysu = new Tiramysu(this.engine);
        this.entityRegistry.add(this.tiramysu);

        const steamyurt = new Prop(new THREE.Vector3(11, 5, -16), 'Steamer Yurt');
        steamyurt.rotation.y = Math.PI / 2;
        this.entityRegistry.add(steamyurt);
        this.engine.resources.loadMeshIntoEntity(steamyurt, '/models/tiramysu-steamyurt.glb', Layers.Environment).catch((error) => {
            console.error('Failed to load Steamer Yurt mesh:', error);
        });

        // Add NPC with lazy loading - load mesh in background (don't block initialization)
        const liltao = new NPC(this.engine, LilTaoSpawnPosition, 'LilTao');
        liltao.initDialogueBubble(LilTaoDialogueBubbleOffset);
        this.entityRegistry.add(liltao);

        this.engine.resources.loadMeshIntoEntity(liltao, '/models/tiramysu-liltao.glb', Layers.NPC).catch((error) => {
            console.error('Failed to load Liltao mesh:', error);
        });
    }

    dispose(): void {
        this.cameraOcclusionSystem.dispose();
    }
}