import * as THREE from 'three';
import { Entity, EntityType } from './entity.js';
import { Engine } from '../engine/engine.js';
import { Layers } from '../constants.js';
import { Interactable } from './interactable.js';
/**
 * Base NPC entity class with lazy mesh loading.
 * NPCs are created with a placeholder mesh and can load their actual model asynchronously.
 */
export class NPC extends Entity {
    private engine: Engine;
    
    dialogueBubble: Interactable | null = null;
    sphere: THREE.Sphere;

    constructor(
        engine: Engine,
        position: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
        name: string = 'NPC') {
        // Create an invisible placeholder mesh
        const invisiblePlaceholder = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0));
        invisiblePlaceholder.visible = false;
        invisiblePlaceholder.name = 'Placeholder';

        super(invisiblePlaceholder, EntityType.NPC);

        this.engine = engine;
        this.position.copy(position);
        this.name = name;
        this.static = true;

        invisiblePlaceholder.geometry.computeBoundingSphere();
        const size = invisiblePlaceholder.geometry.boundingSphere!.radius * 3;
        this.sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), size);

        // Set this entity and all children to NPC layer
        this.layers.set(Layers.NPC);
        for (const child of this.children) {
            child.layers.set(Layers.NPC);
        }
    }

    initDialogueBubble(offset: THREE.Vector3): void {
        const bubbleModel = this.engine.resources.getAsset('/models/tiramysu-dialogue-bubble.glb') as THREE.Object3D;
        this.dialogueBubble = new Interactable(bubbleModel as THREE.Mesh, offset, this.name + ' Dialogue Bubble', EntityType.Interactable, false);
        this.dialogueBubble.visible = false;
        this.add(this.dialogueBubble);
        this.engine.entityRegistry.add(this.dialogueBubble, false);
    }
}
