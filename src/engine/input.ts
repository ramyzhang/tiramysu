import * as THREE from 'three';
import { Engine } from './engine.js';

export class InputManager {
    public intersects: THREE.Intersection[] = [];
    public clicked: boolean = false;

    private engine: Engine;
    private pointer: THREE.Vector2 = new THREE.Vector2();
    private clickEvent: boolean = false;
    private raycaster: THREE.Raycaster = new THREE.Raycaster();

    constructor(_engine: Engine) {
        this.engine = _engine;
    }

    public init(): void {
        window.addEventListener('pointermove', (e: PointerEvent) => this.onPointerMove(e));
        window.addEventListener('pointerdown', (e: PointerEvent) => this.onPointerDown(e));

        this.raycaster.layers.set(0);
    }

    public update(): void {
        this.clicked = this.clickEvent;
        this.clickEvent = false;
        this.raycaster.setFromCamera(this.pointer, this.engine.camera);
        this.intersects = this.raycaster.intersectObjects(this.engine.scene.children, true);
    }

    private onPointerMove(event: PointerEvent): void {
        // calculate pointer position in normalized device coordinates
        // (-1 to +1) for both components
        this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
    }

    private onPointerDown(event: PointerEvent): void {
        this.clickEvent = true;
    }
}