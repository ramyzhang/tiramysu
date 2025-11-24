import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Engine } from './engine.js';
import { Entity } from '../entities/entity.js';

export class ResourceManager {
    private loader: GLTFLoader;
    private loadedAssets: Map<string, THREE.Object3D> = new Map();
    private loadingPromises: Map<string, Promise<THREE.Object3D>> = new Map();

    private engine: Engine;

    constructor(engine: Engine) {
        this.loader = new GLTFLoader();
        this.engine = engine;
    }

    /**
     * Load a GLB/GLTF model
     */
    async loadModel(path: string): Promise<THREE.Object3D> {
        // Return cached model if already loaded
        if (this.loadedAssets.has(path)) {
            return this.loadedAssets.get(path)!.clone();
        }

        // Return existing promise if currently loading
        if (this.loadingPromises.has(path)) {
            const model = await this.loadingPromises.get(path)!;
            return model.clone();
        }

        // Start loading
        const loadPromise = this.loadGLTF(path);
        this.loadingPromises.set(path, loadPromise);

        try {
            const model = await loadPromise;
            this.loadedAssets.set(path, model);
            this.loadingPromises.delete(path);
            return model.clone();
        } catch (error) {
            this.loadingPromises.delete(path);
            throw error;
        }
    }

    /**
     * Internal method to load GLTF
     */
    private loadGLTF(path: string): Promise<THREE.Object3D> {
        return new Promise((resolve, reject) => {
            this.loader.load(
                path,
            (gltf: any) => {
                resolve(gltf.scene);
            },
            (progress: any) => {
                console.log(`Loading ${path}: ${(progress.loaded / progress.total * 100)}%`);
            },
            (error: any) => {
                console.error(`Failed to load ${path}:`, error);
                reject(error);
            }
            );
        });
    }

    /**
     * Preload essential assets
     */
    async loadEssentialAssets(): Promise<void> {
        const essentialAssets = [
            '/models/tiramysu-land-base.glb',
            '/models/tiramysu-land-navmesh.glb',
            '/models/tiramysu-ramy.glb'
        ];

        const loadPromises = essentialAssets.map(asset => this.loadModel(asset));
        await Promise.all(loadPromises);
        
        console.log('Essential assets loaded');
    }

    /**
     * Get a loaded asset by path
     */
    getAsset(path: string): THREE.Object3D | null {
        const asset = this.loadedAssets.get(path);
        return asset ? asset.clone() : null;
    }

    /**
     * Check if an asset is loaded
     */
    isLoaded(path: string): boolean {
        return this.loadedAssets.has(path);
    }

    /**
     * Creates a placeholder mesh for lazy loading.
     * This can be used as a temporary mesh while the actual model loads.
     * 
     * @param options Configuration for the placeholder mesh
     * @returns A placeholder mesh
     */
    createPlaceholderMesh(options?: {
        color?: number;
        width?: number;
        height?: number;
        depth?: number;
    }): THREE.Mesh {
        const color = options?.color ?? 0xff69b4;
        const width = options?.width ?? 0.5;
        const height = options?.height ?? 1;
        const depth = options?.depth ?? 0.5;

        return new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth),
            new THREE.MeshBasicMaterial({ color })
        );
    }

    /**
     * Loads a mesh model asynchronously and replaces a placeholder mesh in an entity.
     * This is useful for lazy loading models without blocking entity construction.
     * The model will start invisible and animate scaling from 0 to 1.
     * 
     * @param entity The entity to load the mesh into
     * @param modelPath Path to the model file
     * @param layer Optional layer to apply to the loaded model's children
     * @param placeholderMesh Optional placeholder mesh to remove (if not provided, will try to find it)
     * @param animationDuration Duration of the scale animation in seconds (default: 0.5)
     * @returns Promise that resolves when the mesh is loaded and animation completes
     */
    async loadMeshIntoEntity(
        entity: THREE.Object3D,
        modelPath: string,
        layer?: number,
        placeholderMesh?: THREE.Mesh,
        animationDuration: number = 0.5
    ): Promise<void> {
        try {
            // Check if model is already loaded in cache
            const cachedModel = this.getAsset(modelPath);
            let model: THREE.Object3D;

            if (cachedModel) {
                model = cachedModel;
            } else {
                // Load the model asynchronously
                model = await this.loadModel(modelPath);
            }

            // Find and remove placeholder mesh if not provided
            // remove placeholder mesh
            this.engine.scene.remove(entity);

            // Remove entity from entity registry and add it back after loading
            this.engine.entityRegistry.remove(entity as Entity);

            // Reset model's transform to origin before adding
            // This ensures the model doesn't affect the entity's position
            model.applyMatrix4(entity.matrixWorld);
            model.visible = true; // Make visible
            model.updateMatrixWorld();

            entity.attach(model);

            // Apply layer to all children of the loaded model if specified
            if (layer !== undefined) {
                model.traverse((child) => {
                    child.layers.set(layer);
                });
            }

            // Add the entity back to the entity registry
            this.engine.entityRegistry.add(entity as Entity);

            // Animate scale from 0 to 1
            await this.animateScale(model, 0, 1, animationDuration);
        } catch (error) {
            console.error(`Failed to load mesh into entity:`, error);
            // Keep the placeholder mesh if loading fails
            throw error;
        }
    }

    /**
     * Animates the scale of an object from startScale to endScale over a duration.
     * 
     * @param object The object to animate
     * @param startScale Starting scale (default: 0)
     * @param endScale Ending scale (default: 1)
     * @param duration Duration in seconds (default: 0.5)
     * @returns Promise that resolves when animation completes
     */
    private animateScale(
        object: THREE.Object3D,
        startScale: number = 0,
        endScale: number = 1,
        duration: number = 0.5
    ): Promise<void> {
        return new Promise((resolve) => {
            const startTime = performance.now();
            const scaleRange = endScale - startScale;

            const animate = () => {
                const elapsed = (performance.now() - startTime) / 1000; // Convert to seconds
                const progress = Math.min(elapsed / duration, 1); // Clamp to 0-1

                // Use ease-out cubic for smooth animation
                const easedProgress = 1 - Math.pow(1 - progress, 3);
                const currentScale = startScale + (scaleRange * easedProgress);

                object.scale.set(currentScale, currentScale, currentScale);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Ensure final scale is exactly endScale
                    object.scale.set(endScale, endScale, endScale);
                    resolve();
                }
            };

            animate();
        });
    }

    /**
     * Clear all loaded assets
     */
    dispose(): void {
        this.loadedAssets.forEach(asset => {
            asset.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        });
        this.loadedAssets.clear();
        this.loadingPromises.clear();
    }
}
