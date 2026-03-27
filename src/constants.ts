import * as THREE from 'three';

export const Colours = Object.freeze({
	peach: 0xFFE5B4,
	rose: 0xFF007F,
	pink: 0xF598B1,
    lightPink: 0xFF80AB,
    darkPink: 0xF06292,
    forestGreen: 0x228B22,
    lightOrange: 0xFFCC80,
    darkOrange: 0xFF6F00
});

export enum Layers {
    Navmesh = 0,
    Interactable = 1,
    NPC = 2,
    Ignore = 3,
    Environment = 4,
    Player = 5,
    Road = 6,
}

// export const PlayerSpawnPosition = new THREE.Vector3(0, 5.0, -10.0);
export const PlayerSpawnPosition = Object.freeze(new THREE.Vector3(-13, 25, -31));
export const PlayerSpawnDirection = Object.freeze(new THREE.Vector3(0, 0, 1));

export const LilTaoSpawnPosition = Object.freeze(new THREE.Vector3(11.5, 4.35, -15));
export const LilTaoDialogueBubbleOffset = Object.freeze(new THREE.Vector3(0.4, 0.9, 0));

export const MeimeiSpawnPosition = Object.freeze(new THREE.Vector3(4, 4.5, -21));
export const MeimeiDialogueBubbleOffset = Object.freeze(new THREE.Vector3(0.4, 1, 0));

export const PurinSpawnPosition = Object.freeze(new THREE.Vector3(-4, 4.45, -14));
export const PurinDialogueBubbleOffset = Object.freeze(new THREE.Vector3(0.4, 1, 0));

// Tanghulu forest configuration
export const TanghuluSpawnZones = Object.freeze([
    Object.freeze({ min: Object.freeze(new THREE.Vector2(13, -40)), max: Object.freeze(new THREE.Vector2(50, 5)) }),
    Object.freeze({ min: Object.freeze(new THREE.Vector2(5, -25)), max: Object.freeze(new THREE.Vector2(15, -15)) }),
]);
export const TanghuluDensity = 0.06; // trees per square unit of area
export const TanghuluScaleRange = Object.freeze({ min: 0.7, max: 1.4 });
export const TanghuluMaxTilt = 0.15; // radians

export const GlobalUp = Object.freeze(new THREE.Vector3(0, 1, 0));
export const GlobalRight = Object.freeze(new THREE.Vector3(1, 0, 0));