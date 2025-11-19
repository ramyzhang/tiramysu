import * as THREE from 'three';
import { Entity, EntityType } from './entity.js';
import { Colours, Layers } from '../constants.js';

/**
 * Interactable entity that can be interacted with by the player.
 * Has a Box3 collider and is set to the Interactable layer.
 */
export class Interactable extends Entity {
    sphere: THREE.Sphere = new THREE.Sphere();

    constructor(mesh: THREE.Mesh, position: THREE.Vector3, name?: string) {
        super(mesh, EntityType.Interactable);
        this.static = true;
        this.position.copy(position);
        
        // Get size of the mesh and create a sphere around it accordingly that's about 1.5x the size of the mesh.
        mesh.geometry.computeBoundingSphere();
        const size = mesh.geometry.boundingSphere!.radius * 3;
        this.sphere.radius = size;

        // Set this entity and all children to Interactable layer
        this.layers.set(Layers.Interactable);
        for (const child of this.children) {
            child.layers.set(Layers.Interactable);
        }

        const sphereMaterial = new THREE.MeshBasicMaterial({ color: Colours.forestGreen, wireframe: true });
        const sphereVisualizer = new THREE.Mesh(new THREE.SphereGeometry(size, 32, 32), sphereMaterial);
        sphereVisualizer.layers.set(Layers.Ignore);
        this.add(sphereVisualizer);
        
        // Set entity name
        this.name = name || 'Interactable';
    }
}

