import * as THREE from 'three';
import { System } from './system.js';
import { Engine } from '../engine/engine.js';
import { Player } from '../entities/player.js';
import { EntityType, Entity } from '../entities/entity.js';
import { Layers } from '../constants.js';

/**
 * System that makes environment meshes transparent when they're between
 * the camera and the player, ensuring the player is always visible.
 */
export class CameraOcclusionSystem extends System {
    private player: Player | null = null;
    private raycaster: THREE.Raycaster;
    private environmentMeshes: THREE.Mesh[] = [];
    private meshMaterialData: Map<THREE.Mesh, {
        originalMaterial: THREE.Material | THREE.Material[];
        transparentMaterial: THREE.Material | THREE.Material[];
    }> = new Map();
    
    private tempVecA: THREE.Vector3 = new THREE.Vector3();
    private tempVecB: THREE.Vector3 = new THREE.Vector3();
    
    // Settings
    private readonly transparencyAlpha: number = 0.2; // Alpha value when transparent
    private readonly fadeSpeed: number = 8.0; // How fast to fade in/out
    private readonly raycastOffset: number = 0.1; // Small offset to avoid hitting player mesh itself

    constructor(engine: Engine) {
        super(engine);
        this.raycaster = new THREE.Raycaster();
        this.raycaster.layers.enable(Layers.Environment);
        this.raycaster.layers.disable(Layers.Player);
    }

    /**
     * Initializes the system by finding the player and collecting environment meshes.
     */
    public init(): void {
        // Find player
        for (const entity of this.engine.entityRegistry.getEntities()) {
            if (entity.entityType === EntityType.Player) {
                this.player = entity as Player;
                break;
            }
        }

        // Collect all environment meshes
        this.collectEnvironmentMeshes();
    }

    /**
     * Recursively collects all meshes from environment entities.
     */
    private collectEnvironmentMeshes(): void {
        this.environmentMeshes = [];
        this.meshMaterialData.clear();

        for (const entity of this.engine.entityRegistry.getEntities()) {
            if (entity.entityType === EntityType.Environment) {
                this.traverseMeshes(entity, (mesh) => {
                    // Skip the collider mesh (wireframe)
                    if (mesh.name === 'collider' || (mesh.material as THREE.MeshBasicMaterial)?.wireframe) {
                        return;
                    }
                    
                    this.environmentMeshes.push(mesh);
                    this.prepareMeshMaterials(mesh);
                });
            }
        }
    }

    /**
     * Traverses an object and its children to find all meshes.
     */
    private traverseMeshes(object: THREE.Object3D, callback: (mesh: THREE.Mesh) => void): void {
        object.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                callback(child);
            }
        });
    }

    /**
     * Prepares materials for transparency switching.
     * Creates transparent versions of materials while preserving originals.
     */
    private prepareMeshMaterials(mesh: THREE.Mesh): void {
        const originalMaterial = mesh.material;
        
        // Create transparent material(s)
        let transparentMaterial: THREE.Material | THREE.Material[];
        
        if (Array.isArray(originalMaterial)) {
            transparentMaterial = originalMaterial.map(mat => this.createTransparentMaterial(mat));
        } else {
            transparentMaterial = this.createTransparentMaterial(originalMaterial);
        }

        this.meshMaterialData.set(mesh, {
            originalMaterial,
            transparentMaterial
        });
    }

    /**
     * Creates a transparent version of a material.
     */
    private createTransparentMaterial(material: THREE.Material): THREE.Material {
        // Clone the material to preserve its properties
        const transparentMat = material.clone();
        
        // Enable transparency
        transparentMat.transparent = true;
        transparentMat.opacity = this.transparencyAlpha;
        
        // Enable depth writing but allow transparency
        transparentMat.depthWrite = false;
        
        // For proper transparency rendering
        transparentMat.side = THREE.DoubleSide;
        
        return transparentMat;
    }

    /**
     * Updates the system, checking for occluding meshes and updating their transparency.
     */
    update(delta: number): void {
        if (!this.player) {
            return;
        }

        // Get camera and player positions
        const cameraPos = this.tempVecA.copy(this.engine.camera.position);
        const playerPos = this.tempVecB.copy(this.player.position);
        
        // Add a small offset to player position to avoid hitting the player mesh itself
        // Offset slightly towards the camera to ensure we detect meshes right in front of player
        const cameraToPlayer = new THREE.Vector3().subVectors(playerPos, cameraPos);
        const direction = cameraToPlayer.normalize();
        const offsetPlayerPos = playerPos.clone().sub(direction.multiplyScalar(this.raycastOffset));

        this.raycaster.set(cameraPos, offsetPlayerPos);
        
        const intersections = this.raycaster.intersectObjects(this.environmentMeshes, false);
        
        // Create a set of meshes that are blocking the view
        const blockingMeshes = new Set<THREE.Mesh>();
        
        for (const intersection of intersections) {
            if (intersection.object instanceof THREE.Mesh) {
                blockingMeshes.add(intersection.object);
            }
        }

        // Update transparency for all environment meshes
        for (const mesh of this.environmentMeshes) {
            const materialData = this.meshMaterialData.get(mesh);
            if (!materialData) continue;

            const isBlocking = blockingMeshes.has(mesh);
            const currentMaterial = mesh.material;
            const targetMaterial = isBlocking ? materialData.transparentMaterial : materialData.originalMaterial;

            // Handle material switching and opacity fading
            const needsMaterialSwitch = currentMaterial !== targetMaterial;
            
            if (needsMaterialSwitch) {
                // Check if we need to switch materials
                let shouldSwitch = false;
                
                if (Array.isArray(currentMaterial) && Array.isArray(targetMaterial)) {
                    // Both are arrays - switch if different
                    shouldSwitch = currentMaterial[0] !== targetMaterial[0];
                } else if (!Array.isArray(currentMaterial) && !Array.isArray(targetMaterial)) {
                    // Both are single materials - switch if different
                    shouldSwitch = currentMaterial !== targetMaterial;
                } else {
                    // Different types - just switch
                    shouldSwitch = true;
                }
                
                if (shouldSwitch) {
                    mesh.material = targetMaterial;
                    
                    // If switching to transparent material, start at current opacity for smooth transition
                    if (isBlocking && !Array.isArray(targetMaterial)) {
                        const mat = targetMaterial as THREE.Material;
                        if (mat.transparent) {
                            // Start from current opacity if we were already transparent, otherwise start from 1.0
                            const prevMat = currentMaterial as THREE.Material;
                            if (prevMat && prevMat.transparent) {
                                mat.opacity = prevMat.opacity;
                            } else {
                                mat.opacity = 1.0;
                            }
                        }
                    }
                }
            }

            // Smoothly fade opacity if using transparent material
            if (isBlocking && !Array.isArray(mesh.material)) {
                const mat = mesh.material as THREE.Material;
                if (mat.transparent) {
                    const targetOpacity = this.transparencyAlpha;
                    const currentOpacity = mat.opacity;
                    const newOpacity = THREE.MathUtils.lerp(currentOpacity, targetOpacity, delta * this.fadeSpeed);
                    mat.opacity = newOpacity;
                }
            } else if (!isBlocking && !Array.isArray(mesh.material)) {
                const mat = mesh.material as THREE.Material;
                if (mat.transparent) {
                    const targetOpacity = 1.0;
                    const currentOpacity = mat.opacity;
                    const newOpacity = THREE.MathUtils.lerp(currentOpacity, targetOpacity, delta * this.fadeSpeed);
                    mat.opacity = newOpacity;
                    
                    // Once fully opaque, switch back to original material
                    if (newOpacity >= 0.99) {
                        mesh.material = materialData.originalMaterial;
                    }
                }
            }
        }
    }

    /**
     * Cleanup method to restore original materials.
     */
    public dispose(): void {
        // Restore all original materials
        for (const [mesh, materialData] of this.meshMaterialData.entries()) {
            mesh.material = materialData.originalMaterial;
            
            // Dispose of cloned transparent materials
            if (Array.isArray(materialData.transparentMaterial)) {
                materialData.transparentMaterial.forEach(mat => mat.dispose());
            } else {
                materialData.transparentMaterial.dispose();
            }
        }
        
        this.meshMaterialData.clear();
        this.environmentMeshes = [];
    }
}

