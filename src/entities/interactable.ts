import * as THREE from 'three';
import { Entity, EntityType } from './entity.js';
import { Colours, Layers } from '../constants.js';

/**
 * Interactable entity that can be interacted with by the player.
 * Has a Box3 collider and is set to the Interactable layer.
 */
export class Interactable extends Entity {
    constructor(mesh: THREE.Mesh, name?: string) {
        super(mesh, EntityType.Interactable);
        
        // Create Box3 collider from the mesh
        const box = new THREE.Box3().setFromObject(mesh).expandByScalar(2);
        this.collider = new THREE.Box3Helper(box, Colours.forestGreen);
        this.add(this.collider);
        
        // Set entity name
        this.name = name || 'Interactable';
        
        // Set this entity and all children to Interactable layer
        this.layers.set(Layers.Interactable);
        for (const child of this.children) {
            child.layers.set(Layers.Interactable);
        }
    }
}

