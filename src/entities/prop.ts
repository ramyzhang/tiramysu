import * as THREE from 'three';
import { Entity, EntityType } from './entity.js';
import { Layers } from '../constants.js';

export class Prop extends Entity {
    constructor(
        position: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
        name: string = 'Prop') {
        // Create an invisible placeholder mesh
        const invisiblePlaceholder = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0));
        invisiblePlaceholder.visible = false;
        invisiblePlaceholder.name = 'Placeholder';

        super(invisiblePlaceholder, EntityType.Prop);

        this.position.copy(position);
        this.name = name;
        this.static = true;

        // Set this entity and all children to Prop layer
        this.layers.set(Layers.Environment);
        for (const child of this.children) {
            child.layers.set(Layers.Environment);
        }
    }
}
