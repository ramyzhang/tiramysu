// update the debug direction for each entity
import * as THREE from 'three';
import { System } from './system.js';
import { Engine } from '../engine/engine.js';

export class DebugDirectionSystem extends System {
    constructor(engine: Engine) {
        super(engine);
    }

    update(delta: number): void {
        const entities = this.engine.entityRegistry.getEntities();
        for (const entity of entities) {
            const direction = entity.getWorldDirection(new THREE.Vector3());
            entity.debugDirection?.setDirection(direction);
        }
    }
}