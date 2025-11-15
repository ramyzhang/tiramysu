import * as THREE from 'three';
import { System } from './system.js';
import { Engine } from '../engine/engine.js';
import { Entity } from '../entities/entity.js';
import { updatePointerPosition } from '../utils/utils.js';
import { Layers } from '../constants.js';

/**
 * DebugUI system that allows raycast selection and display of
 * name, position, and velocity of clicked entity (right mouse button) in a floating window-space div.
 */
export class DebugUI extends System {
    private selectedEntity: Entity | null = null;
    private mouse: THREE.Vector2 = new THREE.Vector2();
    private raycaster: THREE.Raycaster = new THREE.Raycaster();
    private infoDiv: HTMLDivElement;
    private statsDiv: HTMLDivElement;
    private fpsHistory: number[] = [];
    private readonly fpsHistorySize: number = 30;

    constructor(engine: Engine) {
        super(engine);

        // Create floating fixed-position debug div
        this.infoDiv = document.createElement('div');
        this.infoDiv.style.position = 'fixed';
        this.infoDiv.style.right = '20px';
        this.infoDiv.style.top = '20px';
        this.infoDiv.style.width = '325px';
        this.infoDiv.style.background = 'rgba(30,30,40,0.98)';
        this.infoDiv.style.padding = '20px';
        this.infoDiv.style.borderRadius = '16px';
        this.infoDiv.style.fontFamily = 'monospace';
        this.infoDiv.style.fontSize = '15px';
        this.infoDiv.style.zIndex = '99999';
        this.infoDiv.style.color = '#EEE';
        this.infoDiv.style.boxShadow = '0 0 16px 2px #0006';
        this.infoDiv.style.pointerEvents = 'auto';
        this.infoDiv.style.userSelect = 'text';
        this.infoDiv.style.transition = 'opacity 0.1s';
        this.infoDiv.style.opacity = '0.93';
        this.infoDiv.innerText = 'Debug UI\n\nRight-click entity to inspect.';
        document.body.appendChild(this.infoDiv);

        // Create FPS and memory stats div in top left
        this.statsDiv = document.createElement('div');
        this.statsDiv.style.position = 'fixed';
        this.statsDiv.style.left = '20px';
        this.statsDiv.style.top = '20px';
        this.statsDiv.style.background = 'rgba(30,30,40,0.98)';
        this.statsDiv.style.padding = '12px 16px';
        this.statsDiv.style.borderRadius = '12px';
        this.statsDiv.style.fontFamily = 'monospace';
        this.statsDiv.style.fontSize = '14px';
        this.statsDiv.style.zIndex = '99999';
        this.statsDiv.style.color = '#EEE';
        this.statsDiv.style.boxShadow = '0 0 16px 2px #0006';
        this.statsDiv.style.pointerEvents = 'none';
        this.statsDiv.style.userSelect = 'none';
        this.statsDiv.style.lineHeight = '1.6';
        document.body.appendChild(this.statsDiv);

        // Register right-click event for raycasting entities
        window.addEventListener('contextmenu', (e: PointerEvent) => {
            e.preventDefault();
            this.handleRightClick(e);
        });
    }

    update(delta: number): void {
        // Update FPS and memory stats
        this.updateStats(delta);

        if (this.selectedEntity) {
            // Update floating div content with latest live data
            this.renderEntityInfo(this.selectedEntity);
        }
    }

    /**
     * Handles right-click event: raycasts and, if an Entity is hit, shows its data in the floating div.
     */
    private handleRightClick(event: PointerEvent) {
        // Calculate mouse coordinates in normalized device coordinates (-1 to +1)
        const { pointerX, pointerY } = updatePointerPosition(event);
        this.mouse.x = pointerX;
        this.mouse.y = pointerY;

        this.raycaster.layers.enable(Layers.Player);
        this.raycaster.layers.enable(Layers.Environment);
        this.raycaster.setFromCamera(this.mouse, this.engine.camera);

        // Gather all registered entities' Object3D
        const objects: THREE.Object3D[] = this.engine.entityRegistry
            .getEntities()
            .map(entity => entity as THREE.Object3D);

        // Raycast
        const intersects = this.raycaster.intersectObjects(objects, true);

        let foundEntity: Entity | null = null;
        if (intersects.length > 0) {
            // Traverse up the hierarchy to find an Entity
            for (let i = 0; i < intersects.length; i++) {
                let obj: THREE.Object3D | null = intersects[i].object;
                while (obj) {
                    if (obj instanceof Entity) {
                        foundEntity = obj as Entity;
                        break;
                    }
                    obj = obj.parent;
                }
                if (foundEntity) break;
            }
        }

        this.selectedEntity = foundEntity;
        this.renderEntityInfo(foundEntity);
    }

    /**
     * Displays the details of the entity in the floating div.
     */
    private renderEntityInfo(entity: Entity | null) {
        if (!entity) {
            this.infoDiv.innerHTML = `<b>Debug UI</b><br><br><span style="opacity:0.6;">Right-click an entity to inspect.<span>`;
            return;
        }
        // Output entity name, position, velocity prettily
        const position = entity.position;
        const velocity = (entity as any).velocity || { x: 0, y: 0, z: 0 };
        this.infoDiv.innerHTML = `
            <b>Debug UI</b>
            <hr style="margin:10px 0 10px 0; border-color:#444B;">
            <b>Name:</b> <span style="color:#ffcd94">${entity.name || 'Unnamed Entity'}</span><br>
            
            <b>Position:</b>
            <pre style="margin-left:12px;margin-top:3px;margin-bottom:3px;">
x: <span style="color:#7fe3ff">${position.x.toFixed(2)}</span>  
y: <span style="color:#7fe3ff">${position.y.toFixed(2)}</span>  
z: <span style="color:#7fe3ff">${position.z.toFixed(2)}</span>  
            </pre>
            <b>Velocity:</b>
            <pre style="margin-left:12px;margin-top:3px;margin-bottom:0;">
x: <span style="color:#ffa9aa">${velocity.x?.toFixed?.(2) ?? '0.00'}</span>  
y: <span style="color:#ffa9aa">${velocity.y?.toFixed?.(2) ?? '0.00'}</span>  
z: <span style="color:#ffa9aa">${velocity.z?.toFixed?.(2) ?? '0.00'}</span>  
            </pre>
        `.replace(/^\s{12}/gm, ''); // Remove left spaces
    }

    /**
     * Updates and displays FPS and memory usage in the top left corner.
     */
    private updateStats(delta: number): void {
        // Calculate FPS from delta time
        const fps = delta > 0 ? 1 / delta : 0;
        
        // Add to history for smoothing
        this.fpsHistory.push(fps);
        if (this.fpsHistory.length > this.fpsHistorySize) {
            this.fpsHistory.shift();
        }
        
        // Calculate average FPS
        const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        
        // Update stats div
        this.statsDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #7fe3ff;">FPS:</span>
                <span style="color: ${avgFps >= 55 ? '#4ade80' : avgFps >= 30 ? '#fbbf24' : '#f87171'}; font-weight: bold;">
                    ${Math.round(avgFps)}
                </span>
            </div>
        `;
    }

    /**
     * Gets memory usage information from the Performance API.
     */
    private getMemoryInfo(): string {
        // Check for performance.memory (Chrome/Edge)
        const perfMemory = (performance as any).memory;
        if (perfMemory) {
            const used = perfMemory.usedJSHeapSize;
            const total = perfMemory.totalJSHeapSize;
            const limit = perfMemory.jsHeapSizeLimit;
            
            const formatBytes = (bytes: number): string => {
                if (bytes < 1024) return bytes + ' B';
                if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
                if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
                return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
            };
            
            return `${formatBytes(used)} / ${formatBytes(total)}`;
        }
        
        // Fallback if memory API is not available
        return 'N/A';
    }

    dispose(): void {
        this.selectedEntity = null;
        if (this.infoDiv && this.infoDiv.parentElement) {
            this.infoDiv.parentElement.removeChild(this.infoDiv);
        }
        if (this.statsDiv && this.statsDiv.parentElement) {
            this.statsDiv.parentElement.removeChild(this.statsDiv);
        }
    }
}
