import * as THREE from 'three';
import { Colours } from '../constants/colours.js';
import { Engine } from "src/engine/engine.js";

export class DebugLine {
    engine: Engine;
    a: THREE.Vector3 = new THREE.Vector3();
    b: THREE.Vector3 = new THREE.Vector3();

    private line = new THREE.Line();

    constructor(_a: THREE.Vector3, _b: THREE.Vector3, _engine: Engine) {
        const material = new THREE.LineBasicMaterial({
            color: Colours.rose
        });

        const points = [];
        this.a = _a;
        this.b = _b;
        points.push(this.a);
        points.push(this.b);

        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        this.line = new THREE.Line(geometry, material);
        this.line.layers.set(2);

        this.engine = _engine;
        this.engine.scene.add(this.line);
    }

    updatePoints(_a: THREE.Vector3, _b: THREE.Vector3): void {
        this.a = _a;
        this.b = _b;

        this.line.geometry.setFromPoints([this.a, this.b]);
    }
}