import * as THREE from 'three';
import { Engine } from "src/engine/engine.js";
import { Entity } from './entity.js';

export class EntityRegistry {
    private scene: THREE.Scene;
    private entities: Entity[] = [];

    constructor(_engine: Engine) {
        this.scene = _engine.scene;
    }
    
    add(entity: Entity): void {
        this.entities.push(entity);
        this.scene.add(entity);
        this.scene.add(entity.debugCollider); // TODO: remove when ready for PROD
    }

    remove(entity: Entity): void {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
            this.scene.remove(entity);
            this.scene.remove(entity.debugCollider); // TODO: remove when ready for PROD
        }
    }

    getEntities(): Entity[] {
        return this.entities;
    }
}