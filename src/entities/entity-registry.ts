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
    }

    remove(entity: Entity): void {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
            // remove all children of the entity
            entity.traverse((child) => {
                this.scene.remove(child);
            });
            
            this.scene.remove(entity);
        }
    }

    getEntities(): Entity[] {
        return this.entities;
    }
}