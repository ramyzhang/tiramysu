import * as THREE from 'three';
import { Engine } from './engine/engine.js';
import { Colours, Layers } from './constants.js';
import { EntityRegistry, Player, Tiramysu, NPC, Waterfall, Prop, TanghuluForest } from './entities/index.js';
import { CameraSystem } from './systems/camera.js';
import { DebugUI } from './systems/debug-ui.js';
import { PlayerMovementSystem, InteractionSystem, DialogueSystem, CameraOcclusionSystem, NPCMovementSystem, ParticleSystem } from './systems/index.js';
import { LilTaoSpawnPosition, MeimeiSpawnPosition, MeimeiDialogueBubbleOffset, LilTaoDialogueBubbleOffset, PurinSpawnPosition, PurinDialogueBubbleOffset } from './constants.js';

export class World {   
    private engine: Engine;
    private scene: THREE.Scene;
    private entityRegistry: EntityRegistry;
    
    private player!: Player;
    private tiramysu!: Tiramysu;
    private waterfall!: Waterfall;

    private cameraSystem!: CameraSystem;
    private debugUI!: DebugUI;
    private playerMovementSystem!: PlayerMovementSystem;
    public interactionSystem!: InteractionSystem;
    public dialogueSystem!: DialogueSystem;
    private cameraOcclusionSystem!: CameraOcclusionSystem;
    private npcMovementSystem!: NPCMovementSystem;
    private particleSystem!: ParticleSystem;

    constructor(_engine: Engine) {
        this.engine = _engine;
        this.scene = _engine.scene;
        this.entityRegistry = _engine.entityRegistry;
    }

    init(): void {
        this.scene.background = new THREE.TextureLoader().load( 'textures/spyros-skybox.png' );
        this.scene.fog = new THREE.Fog(Colours.pink, 0, 80);
        
        // -------------- initialize lighting --------------
        // const ambientLight = new THREE.AmbientLight(0xffffff, 3.0);
        // this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);

        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x000000, 3.0);
        hemisphereLight.position.set(10, 10, 10);
        this.scene.add(hemisphereLight);

        const pointLight = new THREE.PointLight(0xffffff, 1.0);
        pointLight.position.set(2, 10, 20);
        this.scene.add(pointLight);
        
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
        
        this.particleSystem = new ParticleSystem(this.engine);
    }

    update(delta: number): void {
        this.waterfall.update(delta);

        if (!this.dialogueSystem.isActive()) {
            this.interactionSystem.update(delta);
            this.playerMovementSystem.update(delta);
        }

        this.npcMovementSystem.update(delta);
        this.cameraSystem.update(delta);
        this.debugUI.update(delta);
        this.cameraOcclusionSystem.update(delta);
        this.particleSystem.update(delta);
    }

    spawn(): void {
        this.player = new Player(this.engine);
        this.entityRegistry.add(this.player);
        
        this.tiramysu = new Tiramysu(this.engine);
        this.entityRegistry.add(this.tiramysu);

        this.waterfall = new Waterfall(this.engine);
        this.entityRegistry.add(this.waterfall);

        // Props
        const theatre = new Prop(new THREE.Vector3(0, 0, 0), 'Theatre');
        this.entityRegistry.add(theatre);
        this.engine.resources.loadMeshIntoEntity(theatre, '/models/tiramysu-theatre.glb', Layers.Ignore).catch((error) => {
            console.error('Failed to load Theatre mesh:', error);
        });

        // NPCs
        const liltao = new NPC(this.engine, LilTaoSpawnPosition, 'LilTao');
        liltao.initDialogueBubble(LilTaoDialogueBubbleOffset);
        this.entityRegistry.add(liltao);
        this.engine.resources.loadMeshIntoEntity(liltao, '/models/tiramysu-liltao.glb', Layers.NPC).catch((error) => {
            console.error('Failed to load Liltao mesh:', error);
        });

        const meimei = new NPC(this.engine, MeimeiSpawnPosition, 'Meimei');
        meimei.initDialogueBubble(MeimeiDialogueBubbleOffset);
        this.entityRegistry.add(meimei);
        this.engine.resources.loadMeshIntoEntity(meimei, '/models/tiramysu-meimei.glb', Layers.NPC).catch((error) => {
            console.error('Failed to load Meimei mesh:', error);
        });

        const purin = new NPC(this.engine, PurinSpawnPosition, 'Purin');
        purin.initDialogueBubble(PurinDialogueBubbleOffset);
        this.entityRegistry.add(purin);
        this.engine.resources.loadMeshIntoEntity(purin, '/models/tiramysu-purin.glb', Layers.NPC).catch((error) => {
            console.error('Failed to load Purin mesh:', error);
        });

        // Tanghulu forest (lazy-loaded, does not block init)
        const tanghuluForest = new TanghuluForest(this.engine);
        this.scene.add(tanghuluForest);
        tanghuluForest.spawn(this.tiramysu.collider as THREE.Mesh).catch((error) => {
            console.error('Failed to spawn tanghulu forest:', error);
        });
    }

    dispose(): void {
        this.cameraOcclusionSystem.dispose();
        this.particleSystem.dispose();
    }
}