import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ResourceManager {
    private loader: GLTFLoader;
    private loadedAssets: Map<string, THREE.Object3D> = new Map();
    private loadingPromises: Map<string, Promise<THREE.Object3D>> = new Map();

    constructor() {
        this.loader = new GLTFLoader();
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
            '/models/tiramysu-land-navmesh.glb'
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
