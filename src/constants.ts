import * as THREE from 'three';

export const Colours = {
	peach: 0xFFE5B4,
	rose: 0xFF007F,
	pink: 0xF598B1,
    lightPink: 0xFF80AB,
    darkPink: 0xF06292,
    forestGreen: 0x228B22,
    lightOrange: 0xFFCC80,
    darkOrange: 0xFF6F00
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

export const LilTaoSpawnPosition = new THREE.Vector3(11.5, 4.35, -15);
export const LilTaoDialogueBubbleOffset = new THREE.Vector3(0.4, 0.9, 0);

export const MeimeiSpawnPosition = new THREE.Vector3(4, 4.5, -21);
export const MeimeiDialogueBubbleOffset = new THREE.Vector3(0.4, 1, 0);

export const PurinSpawnPosition = new THREE.Vector3(-4, 4.45, -14);
export const PurinDialogueBubbleOffset = new THREE.Vector3(0.4, 1, 0);