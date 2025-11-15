import * as THREE from 'three';
import { MeshBVH, StaticGeometryGenerator } from 'three-mesh-bvh';

import { Entity, EntityType } from "./entity.js";
import { Engine } from '../engine/engine.js';
import { Layers, Colours } from '../constants.js';

export class Tiramysu extends Entity {
    constructor(engine: Engine) {
        // Try to load the GLB model first
        let mesh: THREE.Object3D;
        
        try {
            const model = engine.resources.getAsset('/models/tiramysu-land-base.glb');
            if (model) {
                mesh = model.clone();
            } else {
                throw new Error('Model not loaded yet');
            }
        } catch (error) {
            console.error('Failed to load tiramysu-land-base.glb,', error);
            return;
        }

        const staticGenerator = new StaticGeometryGenerator(mesh);
        staticGenerator.attributes = [ 'position' ];
        const mergedGeometry = staticGenerator.generate();
        mergedGeometry.boundsTree = new MeshBVH(mergedGeometry);

        super(mesh as THREE.Mesh, EntityType.Environment);

        this.collider = new THREE.Mesh(mergedGeometry);
        (this.collider as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: Colours.rose, wireframe: true });
        this.add(this.collider);

        this.name = 'Tiramysu';
        this.static = true;
        for (const child of this.children) {
            child.layers.set(Layers.Environment);
        }
    }
}