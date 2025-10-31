import * as THREE from 'three';
import { Entity, EntityType } from "./entity.js";
import { Engine } from '../engine/engine.js';

export class Tiramysu extends Entity {
    constructor(engine: Engine) {
        // Try to load the GLB model first
        let mesh: THREE.Object3D;
        
        try {
            const model = engine.resources.getAsset('/models/tiramysu-land-base.glb');
            if (model) {
                mesh = model.clone();
                mesh.scale.setScalar(0.5); // Scale to 10% of original size
            } else {
                throw new Error('Model not loaded yet');
            }
        } catch (error) {
            console.error('Failed to load tiramysu-land-base.glb,', error);
            return;
        }

        super(mesh as THREE.Mesh, EntityType.Environment);

        this.name = 'Tiramysu';
        this.static = true;
    }
}