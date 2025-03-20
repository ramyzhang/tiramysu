import * as THREE from 'three';
import { Entity, EntityType } from "./entity.js";

export class Tiramysu extends Entity {
    constructor() {
        const textureLoader = new THREE.TextureLoader();
        const textureIcing = textureLoader.load('/textures/cake-icing.png');
        const textureSides = textureLoader.load('/textures/cake-sides.png');
        const textureBottom = textureLoader.load('/textures/cake-bottom.png');
        
        const geometry = new THREE.BoxGeometry(10, 1, 10);
        const material = [
            new THREE.MeshBasicMaterial({ map: textureSides }), // right
            new THREE.MeshBasicMaterial({ map: textureSides }), // left
            new THREE.MeshBasicMaterial({ map: textureIcing }), // top
            new THREE.MeshBasicMaterial({ map: textureBottom }), // bottom
            new THREE.MeshBasicMaterial({ map: textureSides }), // front
            new THREE.MeshBasicMaterial({ map: textureSides }) // back
        ];

        super(new THREE.Mesh(geometry, material), EntityType.Environment);

        this.name = 'Tiramysu';

        this.static = true;
    }
}