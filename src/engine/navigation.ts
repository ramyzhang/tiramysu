import * as THREE from 'three';
import { Engine } from './engine.js';
import { Pathfinding, PathfindingHelper } from 'three-pathfinding';

const ZONE = 'level1';

export class NavigationManager {
    private engine: Engine;
    private pathfinding: Pathfinding;
    private navMeshGeometry: THREE.BufferGeometry | null = null;
    private navMeshObject: THREE.Object3D | null = null;
    private pathfindingHelper: PathfindingHelper;

    constructor(_engine: Engine) {
        this.engine = _engine;
        this.pathfinding = new Pathfinding();
        this.pathfindingHelper = new PathfindingHelper();
        this.engine.scene.add(this.pathfindingHelper);
    }

    // Load a navmesh from a GLB and register a zone
    async loadNavmesh(): Promise<void> {
        const root = await this.engine.resources.loadModel('/models/tiramysu-land-navmesh.glb');

        let zoneSet = false;
        root.traverse((node) => {
            if (zoneSet) return;
            const m = node as any;
            if (m && m.isMesh && m.geometry) {       
                // Hide the navmesh from rendering
                // m.visible = false;
                
                // Pathfinding needs scaled geometry
                this.navMeshGeometry = m.geometry.clone() as THREE.BufferGeometry;

                this.navMeshObject = m;
                
                // Set up debug visualization
                this.setupNavmeshDebug();
                
                const zone = Pathfinding.createZone(this.navMeshGeometry);
                this.pathfinding.setZoneData(ZONE, zone);
                zoneSet = true;                
            }
        });
    }

    // Find a path from A to B on the registered zone
    findPath(start: THREE.Vector3, end: THREE.Vector3): THREE.Vector3[] {
        const groupID = this.pathfinding.getGroup(ZONE, start);
        if (groupID === null) return [start.clone(), end.clone()];
        const closest = this.pathfinding.getClosestNode(start, ZONE, groupID);
        const path = this.pathfinding.findPath(closest.centroid, end, ZONE, groupID);
        return path ?? [start.clone(), end.clone()];
    }

    // Get group for a position (null if off-mesh)
    getGroup(point: THREE.Vector3): number | null {
        return this.pathfinding.getGroup(ZONE, point);
    }

    // Check if a point is on the navmesh
    isPointOnNavmesh(point: THREE.Vector3): boolean {
        return this.pathfinding.getGroup(ZONE, point) !== null;
    }

    // Debug visualization setup
    private setupNavmeshDebug(): void {
        if (!this.navMeshObject) return;
        
        // Add wireframe for navmesh visualization
        const wireframe = new THREE.WireframeGeometry(this.navMeshGeometry!);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ff00, 
            transparent: true, 
            opacity: 0.5 
        });
        const wireframeMesh = new THREE.LineSegments(wireframe, lineMaterial);
        wireframeMesh.name = 'NavmeshDebug';
        
        this.engine.scene.add(wireframeMesh);
    }

    // Draw path debug visualization using PathfindingHelper
    drawPath(path: THREE.Vector3[]): void {
        if (path.length < 2) {
            this.pathfindingHelper.reset();
            return;
        }
        
        this.pathfindingHelper.setPath(path);
    }

    // Clear path debug visualization
    clearPath(): void {
        this.pathfindingHelper.reset();
    }

    // Set player position marker in PathfindingHelper
    setPlayerPosition(position: THREE.Vector3): void {
        this.pathfindingHelper.setPlayerPosition(position);
    }

    // Set target position marker in PathfindingHelper
    setTargetPosition(position: THREE.Vector3): void {
        this.pathfindingHelper.setTargetPosition(position);
    }

    // Toggle navmesh visibility
    toggleNavmeshVisibility(visible: boolean): void {
        if (this.navMeshObject) {
            this.navMeshObject.visible = visible;
        }
        
        // Also toggle wireframe
        const wireframe = this.engine.scene.getObjectByName('NavmeshDebug');
        if (wireframe) {
            wireframe.visible = visible;
        }
    }
}
