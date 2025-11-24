import * as THREE from 'three';

export const Colours = {
	peach: 0xFFE5B4,
	rose: 0xFF007F,
	pink: 0xF598B1,
    forestGreen: 0x228B22
}

export enum Layers {
    Navmesh = 0,
    Interactable = 1,
    NPC = 2,
    Ignore = 3,
    Environment = 4,
    Player = 5,
}

export const PlayerSpawnPosition = new THREE.Vector3(0, 5.0, -10.0);
export const PlayerSpawnDirection = new THREE.Vector3(0, 0, 1);

export const LilTaoSpawnPosition = new THREE.Vector3(8, 4.35, -15)