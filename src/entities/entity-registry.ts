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
        if (entity.debugCollider) this.scene.add(entity.debugCollider); // TODO: remove when ready for production
    }

    remove(entity: Entity): void {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
            this.scene.remove(entity);
            if (entity.debugCollider) this.scene.remove(entity.debugCollider); // TODO: remove when ready for production
        }
    }

    getEntities(): Entity[] {
        return this.entities;
    }
}