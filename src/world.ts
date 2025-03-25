import * as THREE from 'three';
import { Engine } from './engine/engine.js';
import { Colours } from './constants/colours.js';
import { EntityRegistry } from './entities/entity-registry.js';
import { Player } from './entities/player.js';
import { Tiramysu } from './entities/tiramysu.js';
import { DebugLine } from './entities/debugline.js';

export class World {   
    private engine: Engine;
    private scene: THREE.Scene;
    private entityRegistry: EntityRegistry;
    
    private player!: Player;
    private tiramysu!: Tiramysu;
    private pathLine!: DebugLine;

    constructor(_engine: Engine) {
        this.engine = _engine;
        this.scene = _engine.scene;
        this.entityRegistry = _engine.entityRegistry;
    }

    init(): void {
        this.scene.background = new THREE.Color(Colours.peach); // peach

        // -------------- initialize entities --------------
        this.player = new Player();
        this.entityRegistry.add(this.player);
        
        this.tiramysu = new Tiramysu();
        this.entityRegistry.add(this.tiramysu);

        this.engine.camera.position.z = 10; // move the camera back
        this.engine.camera.position.y = 5; // move the camera up
        this.engine.camera.rotation.x = - Math.PI / 6;

        // -------------- initialize debugline -----------
        this.pathLine = new DebugLine(new THREE.Vector3(), this.player.position, this.engine);
    }

    update(delta: number): void {
        if (this.engine.input.intersects.length > 0) {
            const intersect = this.engine.input.intersects[0];
            const offset = intersect.point.clone().add(new THREE.Vector3(0, 5, 0));
            this.pathLine.updatePoints(intersect.point, offset);
            if (this.engine.input.clicked) {
                const newDir = intersect.point.clone().sub(this.player.position);
                this.player.velocity.add(newDir);
            }
        }     

        this.engine.camera.position.x = this.player.position.x;
        this.engine.camera.position.y = this.player.position.y + 5;
        this.engine.camera.position.z = this.player.position.z - 10;

        const playerPos = new THREE.Vector3(this.player.velocity.x, this.player.velocity.z).normalize();
        this.engine.camera.lookAt(playerPos);
    }
}