import * as THREE from 'three';
import { Engine } from '../engine/engine.js';
import { Layers, TanghuluSpawnZones, TanghuluDensity, TanghuluScaleRange, TanghuluMaxTilt } from '../constants.js';

export interface TanghuluSpawnZone {
    min: THREE.Vector2;
    max: THREE.Vector2;
}

const FRUITS = ['Grape', 'Hawthorne', 'Orange', 'Strawberry'];

const FRUIT_POSITION_MAP: Map<string, number> = new Map();
for (const fruit of FRUITS) {
    FRUIT_POSITION_MAP.set(fruit, 0);
    FRUIT_POSITION_MAP.set(fruit + '001', 1);
    FRUIT_POSITION_MAP.set(fruit + '002', 2);
}

export class TanghuluForest extends THREE.Group {
    private engine: Engine;

    public spawnZones: TanghuluSpawnZone[];
    public minScale: number = TanghuluScaleRange.min;
    public maxScale: number = TanghuluScaleRange.max;
    public maxRotationTilt: number = TanghuluMaxTilt;
    public density: number = TanghuluDensity;
    public raycastHeight: number = 50;
    public animationDuration: number = 0.5;
    public maxStaggerDelay: number = 200;
    public exclusionLayer: number = Layers.Road;

    private modelPath: string;

    constructor(engine: Engine, spawnZones: TanghuluSpawnZone[] = TanghuluSpawnZones, modelPath: string = '/models/tiramysu-tanghulu.glb') {
        super();
        this.engine = engine;
        this.spawnZones = spawnZones;
        this.modelPath = modelPath;
        this.name = 'TanghuluForest';
    }

    async spawn(terrainCollider: THREE.Mesh): Promise<void> {
        const model = await this.engine.resources.loadModel(this.modelPath);
        const raycaster = new THREE.Raycaster();
        const rayOrigin = new THREE.Vector3();
        const downDirection = new THREE.Vector3(0, -1, 0);
        const scaleRange = this.maxScale - this.minScale;

        const exclusionRaycaster = new THREE.Raycaster();
        exclusionRaycaster.layers.set(this.exclusionLayer);
        const exclusionObjects: THREE.Object3D[] = [];
        this.engine.scene.traverse((obj) => {
            if (obj.layers.isEnabled(this.exclusionLayer)) exclusionObjects.push(obj);
        });

        for (const zone of this.spawnZones) {
            const width = Math.abs(zone.max.x - zone.min.x);
            const depth = Math.abs(zone.max.y - zone.min.y);
            const count = Math.floor(width * depth * this.density);

            for (let i = 0; i < count; i++) {
                rayOrigin.set(
                    zone.min.x + Math.random() * width,
                    this.raycastHeight,
                    zone.min.y + Math.random() * depth
                );
                raycaster.set(rayOrigin, downDirection);
                const hits = raycaster.intersectObject(terrainCollider, true);
                if (hits.length === 0) continue;

                if (exclusionObjects.length > 0) {
                    exclusionRaycaster.set(rayOrigin, downDirection);
                    let excluded = false;
                    for (const obj of exclusionObjects) {
                        if (exclusionRaycaster.intersectObject(obj, true).length > 0) {
                            excluded = true;
                            break;
                        }
                    }
                    if (excluded) continue;
                }

                const clone = model.clone();
                this.initClone(clone, hits[0].point, scaleRange);
                this.add(clone);
            }
        }

        this.animateTreesIn();
    }

    /** Randomize fruits, set layers, apply transform — single traversal per clone */ 
    private initClone(clone: THREE.Object3D, position: THREE.Vector3, scaleRange: number): void {
        const positions: THREE.Object3D[][] = [[], [], []];

        clone.traverse((child) => {
            child.layers.set(Layers.Ignore);
            const posIndex = FRUIT_POSITION_MAP.get(child.name);
            if (posIndex !== undefined) {
                positions[posIndex].push(child);
            }
        });

        for (const group of positions) {
            if (group.length === 0) continue;
            const chosenIndex = Math.floor(Math.random() * group.length);
            for (let i = 0; i < group.length; i++) {
                group[i].visible = (i === chosenIndex);
            }
        }

        clone.rotation.set(
            (Math.random() * 2 - 1) * this.maxRotationTilt,
            Math.random() * Math.PI * 2,
            (Math.random() * 2 - 1) * this.maxRotationTilt
        );
        clone.position.copy(position);
        clone.scale.set(0, 0, 0);
        clone.userData.targetScale = this.minScale + Math.random() * scaleRange;
    }

    // Single rAF loop to animate all trees in with staggered delays
    private animateTreesIn(): void {
        const now = performance.now();
        const trees: { obj: THREE.Object3D; target: number; start: number }[] = [];

        for (const tree of this.children) {
            trees.push({
                obj: tree,
                target: tree.userData.targetScale as number,
                start: now + Math.random() * this.maxStaggerDelay,
            });
        }

        const duration = this.animationDuration * 1000;

        const animate = (): void => {
            const t = performance.now();
            let allDone = true;

            for (const entry of trees) {
                const elapsed = t - entry.start;
                if (elapsed < 0) { allDone = false; continue; }

                const progress = Math.min(elapsed / duration, 1);
                if (progress < 1) allDone = false;

                const eased = 1 - Math.pow(1 - progress, 3);
                const s = entry.target * eased;
                entry.obj.scale.set(s, s, s);
            }

            if (!allDone) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }
}
