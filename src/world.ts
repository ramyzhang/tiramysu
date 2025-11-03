import * as THREE from 'three';
import { Engine } from './engine/engine.js';
import { Colours } from './constants/colours.js';
import { EntityRegistry } from './entities/entity-registry.js';
import { Player } from './entities/player.js';
import { Tiramysu } from './entities/tiramysu.js';
import { DebugLine } from './entities/debugline.js';
import { CameraSystem } from './systems/camera.js';
import { DebugUI } from './systems/debug-ui.js';

export class World {   
    private engine: Engine;
    private scene: THREE.Scene;
    private entityRegistry: EntityRegistry;
    
    private player!: Player;
    private tiramysu!: Tiramysu;
    private pathLine!: DebugLine;
    private cameraSystem!: CameraSystem;
    private debugUI!: DebugUI;

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

        // -------------- initialize camera system --------------
        this.cameraSystem = new CameraSystem(this.engine);
        this.cameraSystem.setPlayer(this.player);

        // -------------- initialize debug UI --------------
        this.debugUI = new DebugUI(this.engine);

        // -------------- initialize debugline -----------
        this.pathLine = new DebugLine(new THREE.Vector3(), this.player.position, this.engine);
    }

    update(delta: number): void {
        if (this.engine.input.intersects.length > 0) {
            const intersect = this.engine.input.intersects[0];
            const offset = intersect.point.clone().add(new THREE.Vector3(0, 5, 0));
            
            this.pathLine.updatePoints(intersect.point, offset);
            if (this.engine.input.clicked) {
                this.player.setDestination(intersect.point);
            }
        }

        // Update player movement along navmesh path
        this.player.updateMovement(delta);

        // Update camera system
        this.cameraSystem.update(delta);

        // Update debug UI
        this.debugUI.update(delta);
    }
}