import * as THREE from 'three';
import { Entity, EntityType } from './entity.js';
import { Colours, Layers } from '../constants.js';

/**
 * Interactable entity that can be interacted with by the player.
 * Has a Box3 collider and is set to the Interactable layer.
 */
export class Interactable extends Entity {
    sphere: THREE.Sphere | null = null;

    constructor(mesh: THREE.Mesh, position: THREE.Vector3, name?: string, entityType: EntityType = EntityType.Interactable, shouldCreateSphere: boolean = true) {
        super(mesh, entityType);
        this.position.copy(position);
        
        if (shouldCreateSphere) {
            // Get size of the mesh and create a sphere around it accordingly that's about 1.5x the size of the mesh.
            mesh.geometry.computeBoundingSphere();
            const size = mesh.geometry.boundingSphere!.radius * 3;
            this.sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), size);
        }

        // Set this entity and all children to Interactable layer
        this.layers.set(Layers.Interactable);
        for (const child of this.children) {
            child.layers.set(Layers.Interactable);
        }

        // Set entity name
        this.name = name ?? 'Interactable';
    }
}

