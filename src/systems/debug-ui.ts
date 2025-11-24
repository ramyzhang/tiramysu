import * as THREE from 'three';
import { System } from './system.js';
import { Engine } from '../engine/engine.js';
import { Entity, EntityType } from '../entities/entity.js';
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
    private currentIntersections: THREE.Intersection[] = [];
    private infoDiv: HTMLDivElement;
    private statsDiv: HTMLDivElement;
    private fpsHistory: number[] = [];
    private readonly fpsHistorySize: number = 30;
    private frameCounter: number = 0;
    private cachedVelocity: THREE.Vector3 = new THREE.Vector3();
    private cameraInfoFrameCounter: number = 0;
    private cachedCameraPosition: THREE.Vector3 = new THREE.Vector3();
    private cachedCameraDirection: THREE.Vector3 = new THREE.Vector3();
    private debugSphere: THREE.Mesh | null = null;

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

        // Register right-click event for raycasting entities via InputManager
        this.engine.input.setContextMenuCallback((e: PointerEvent) => {
            this.handleRightClick(e);
        });

        // Setup raycaster layers
        this.raycaster.layers.enable(Layers.Player);
        this.raycaster.layers.enable(Layers.Environment);
        this.raycaster.layers.enable(Layers.Interactable);
        this.raycaster.layers.enable(Layers.NPC);

        this.createDebugSphere();
    }

    update(delta: number): void {
        // Update FPS and memory stats
        this.updateStats(delta);

        // Update camera info cache every 20 frames
        this.cameraInfoFrameCounter++;
        if (this.cameraInfoFrameCounter >= 20) {
            this.cachedCameraPosition.copy(this.engine.camera.position);
            this.engine.camera.getWorldDirection(this.cachedCameraDirection);
            this.cameraInfoFrameCounter = 0;
        }

        // Perform raycast every frame
        this.performRaycast();

        // Update debug sphere using shared intersection results
        this.updateDebugSphere();

        if (this.selectedEntity) {
            // Update velocity cache every 20 frames
            this.frameCounter++;
            if (this.frameCounter >= 20) {
                const velocity = (this.selectedEntity as any).velocity;
                if (velocity) {
                    this.cachedVelocity.set(velocity.x || 0, velocity.y || 0, velocity.z || 0);
                }
                this.frameCounter = 0;
            }
            
            // Update floating div content with latest live data
            this.renderEntityInfo(this.selectedEntity);
        }
    }

    /**
     * Performs raycast every frame and stores the results.
     */
    private performRaycast(): void {
        const input = this.engine.input;
        this.mouse.copy(input.pointerPosition);
        this.raycaster.setFromCamera(this.mouse, this.engine.camera);
        this.currentIntersections = this.raycaster.intersectObjects(this.engine.entityRegistry.getEntities(), true);
    }

    /**
     * Handles right-click event: uses the current intersection results to find and select an Entity.
     */
    private handleRightClick(event: PointerEvent) {
        // Use the most recent intersection results from the update loop
        let foundEntity: Entity | null = null;
        if (this.currentIntersections.length > 0) {
            // Traverse up the hierarchy to find an Entity
            for (let i = 0; i < this.currentIntersections.length; i++) {
                let obj: THREE.Object3D | null = this.currentIntersections[i].object;
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
        // Reset frame counter and cache velocity when selecting a new entity
        if (foundEntity) {
            this.frameCounter = 0;
            const velocity = (foundEntity as any).velocity;
            if (velocity) {
                this.cachedVelocity.set(velocity.x || 0, velocity.y || 0, velocity.z || 0);
            }
        }
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
        // Use cached velocity (updated every 5 frames) instead of current velocity
        const velocity = this.cachedVelocity;
        
        // Check if this is the player entity to show isOnGround
        const isPlayer = entity.entityType === EntityType.Player;
        const isOnGround = isPlayer ? this.engine.physics.isOnGround : null;
        
        this.infoDiv.innerHTML = `
            <b>Debug UI</b>
            <hr style="margin:10px 0 10px 0; border-color:#444B;">
            <b>Name:</b> <span style="color:#ffcd94">${entity.name || 'Unnamed Entity'}</span><br>
            <b>Position:</b> (<span style="color:#7fe3ff">${position.x.toFixed(2)}</span>, <span style="color:#7fe3ff">${position.y.toFixed(2)}</span>, <span style="color:#7fe3ff">${position.z.toFixed(2)}</span>)<br>
            <b>Velocity:</b> (<span style="color:#ffa9aa">${velocity.x.toFixed(2)}</span>, <span style="color:#ffa9aa">${velocity.y.toFixed(2)}</span>, <span style="color:#ffa9aa">${velocity.z.toFixed(2)}</span>)${isOnGround !== null ? `<br>
            <b>Is On Ground:</b> <span style="color:${isOnGround ? '#4ade80' : '#f87171'}">${isOnGround ? 'true' : 'false'}</span>` : ''}
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
            <div style="margin-top: 8px; font-size: 12px;">
                <div style="color: #7fe3ff; margin-bottom: 4px;">Camera Position:</div>
                <div style="color: #ffcd94; margin-left: 8px;">
                    (${this.cachedCameraPosition.x.toFixed(2)}, ${this.cachedCameraPosition.y.toFixed(2)}, ${this.cachedCameraPosition.z.toFixed(2)})
                </div>
                <div style="color: #7fe3ff; margin-top: 6px; margin-bottom: 4px;">Camera Direction:</div>
                <div style="color: #ffcd94; margin-left: 8px;">
                    (${this.cachedCameraDirection.x.toFixed(2)}, ${this.cachedCameraDirection.y.toFixed(2)}, ${this.cachedCameraDirection.z.toFixed(2)})
                </div>
            </div>
        `;
    }

    /**
     * Creates a debug sphere mesh for visualizing interaction raycast hits.
     */
    private createDebugSphere(): void {
        const geometry = new THREE.SphereGeometry(0.1, 16, 16);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            wireframe: false,
            transparent: true,
            opacity: 0.8
        });
        this.debugSphere = new THREE.Mesh(geometry, material);
        this.debugSphere.visible = false;
        this.debugSphere.name = 'InteractionRaycastDebugSphere';
        this.engine.scene.add(this.debugSphere);
    }

    /**
     * Updates the debug sphere position based on the current intersection results.
     */
    private updateDebugSphere(): void {
        if (!this.debugSphere) return;

        if (this.currentIntersections.length > 0) {
            this.debugSphere.position.copy(this.currentIntersections[0].point);
            this.debugSphere.visible = true;
        } else {
            this.debugSphere.visible = false;
        }
    }

    dispose(): void {
        this.selectedEntity = null;
        // Clear context menu callback
        this.engine.input.clearContextMenuCallback();
        // Remove debug sphere
        if (this.debugSphere) {
            this.engine.scene.remove(this.debugSphere);
            this.debugSphere = null;
        }
        if (this.infoDiv && this.infoDiv.parentElement) {
            this.infoDiv.parentElement.removeChild(this.infoDiv);
        }
        if (this.statsDiv && this.statsDiv.parentElement) {
            this.statsDiv.parentElement.removeChild(this.statsDiv);
        }
    }
}
