import { System } from './system.js';
import { Engine } from '../engine/engine.js';
import * as THREE from 'three';

export class DebugUI extends System {
    private debugElement: HTMLDivElement | null = null;

    constructor(engine: Engine) {
        super(engine);
        this.setupDebugUI();
    }

    private setupDebugUI(): void {
        // Create debug overlay element
        this.debugElement = document.createElement('div');
        this.debugElement.id = 'debug-ui';
        this.debugElement.style.position = 'fixed';
        this.debugElement.style.top = '10px';
        this.debugElement.style.left = '10px';
        this.debugElement.style.color = '#ffffff';
        this.debugElement.style.fontFamily = 'monospace';
        this.debugElement.style.fontSize = '14px';
        this.debugElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.debugElement.style.padding = '8px';
        this.debugElement.style.borderRadius = '4px';
        this.debugElement.style.zIndex = '1000';
        this.debugElement.style.pointerEvents = 'none';
        
        document.body.appendChild(this.debugElement);
    }

    update(delta: number): void {
        if (!this.debugElement) return;

        const camera = this.engine.camera;
        const pos = camera.position;
        
        // Format position with 2 decimal places
        const x = pos.x.toFixed(2);
        const y = pos.y.toFixed(2);
        const z = pos.z.toFixed(2);
        
        this.debugElement.textContent = `Camera Position:\nX: ${x}\nY: ${y}\nZ: ${z}`;
    }

    dispose(): void {
        if (this.debugElement) {
            document.body.removeChild(this.debugElement);
            this.debugElement = null;
        }
    }
}

