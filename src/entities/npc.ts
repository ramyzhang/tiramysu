import * as THREE from 'three';
import { EntityType } from './entity.js';
import { Engine } from '../engine/engine.js';
import { Layers } from '../constants.js';
import { Interactable } from './interactable.js';

/**
 * Base NPC entity class with lazy mesh loading.
 * NPCs are created with a placeholder mesh and can load their actual model asynchronously.
 */
export class NPC extends Interactable {
    protected engine: Engine;
    protected modelPath: string;

    constructor(
        engine: Engine,
        modelPath: string,
        position: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
        name: string = 'NPC',
    ) {
        // Create an invisible placeholder mesh
        const invisiblePlaceholder = new THREE.Mesh(
            new THREE.BoxGeometry(1.0, 1.0, 1.0), // Tiny invisible box
        );
        invisiblePlaceholder.visible = false;

        super(invisiblePlaceholder, position, name, EntityType.NPC);
        this.engine = engine;
        this.modelPath = modelPath;

        this.position.copy(position);
        this.name = name;
        this.static = true;

        // Set this entity and all children to NPC layer
        this.layers.set(Layers.NPC);
        for (const child of this.children) {
            child.layers.set(Layers.NPC);
        }
    }
}

