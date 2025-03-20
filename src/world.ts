import * as THREE from 'three';
import { Engine } from './engine/engine.js';
import { Colours } from './constants/colours.js';
import { EntityRegistry } from './entities/entity-registry.js';
import { Player } from './entities/player.js';
import { Tiramysu } from './entities/tiramysu.js';

export class World {   
    private engine: Engine;
    private scene: THREE.Scene;
    private entityRegistry: EntityRegistry;
    
    private player!: Player;
    private tiramysu!: Tiramysu;

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
    }

    update(delta: number): void {
        if (this.engine.input.intersects.length > 0) {
            const intersect = this.engine.input.intersects[0];
            console.log(intersect.object.uuid + " | " + intersect.object.name + ": " + intersect.object.type);
        }     

        const playerPos = new THREE.Vector3(this.player.velocity.x, 0, this.player.velocity.z).normalize();
        this.engine.camera.lookAt(playerPos);
        this.engine.camera.position.y = this.player.position.y + 5;
    }
}