import * as THREE from 'three';
import { Engine } from './engine.js';
import { Pathfinding } from 'three-pathfinding';

const ZONE = 'level1';

export class NavigationManager {
    private engine: Engine;
    private pathfinding: Pathfinding;
    private navMeshGeometry: THREE.BufferGeometry | null = null;
    private navMeshObject: THREE.Object3D | null = null;
    private debugPathLine: THREE.Line | null = null;
    private debugWaypoints: THREE.Group | null = null;

    constructor(_engine: Engine) {
        this.engine = _engine;
        this.pathfinding = new Pathfinding();
    }

    // Load a navmesh from a GLB and register a zone
    async loadNavmesh(): Promise<void> {
        const root = await this.engine.resources.loadModel('/models/tiramysu-land-navmesh.glb');
        
        // Scale factor matching the base mesh (0.5 = 50% of original size)
        const NAVMESH_SCALE = 0.5;

        let zoneSet = false;
        root.traverse((node) => {
            if (zoneSet) return;
            const m = node as any;
            if (m && m.isMesh && m.geometry) {
                // Scale the navmesh to match the base mesh
                m.scale.setScalar(NAVMESH_SCALE);
                
                // Hide the navmesh from rendering
                // m.visible = false;

                // Clone and scale the geometry for pathfinding
                // Pathfinding needs scaled geometry, not just scaled transform
                this.navMeshGeometry = m.geometry.clone() as THREE.BufferGeometry;
                const scaleMatrix = new THREE.Matrix4().makeScale(NAVMESH_SCALE, NAVMESH_SCALE, NAVMESH_SCALE);
                this.navMeshGeometry.applyMatrix4(scaleMatrix);
                
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

        const path = this.pathfinding.findPath(start, end, ZONE, groupID);
        return path ? path.map((p: any) => new THREE.Vector3(p.x, p.y, p.z)) : [start.clone(), end.clone()];
    }

    // Get group for a position (null if off-mesh)
    getGroup(point: THREE.Vector3): number | null {
        return this.pathfinding.getGroup(ZONE, point);
    }

    // Check if a point is on the navmesh
    isPointOnNavmesh(point: THREE.Vector3): boolean {
        return this.pathfinding.getGroup(ZONE, point) !== null;
    }

    // Snap a position to the nearest point on the navmesh
    // snapToNavMesh(point: THREE.Vector3): THREE.Vector3 {
    //     const groupID = this.pathfinding.getGroup(ZONE, point);
    //     if (groupID === null) return point.clone();
    //     const node = this.pathfinding.getClosestNode(point, ZONE, groupID) as any;
    //     return new THREE.Vector3(node.x, node.y, node.z);
    // }

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

    // Draw path debug visualization
    drawPath(path: THREE.Vector3[]): void {
        // Remove existing path line and waypoints
        if (this.debugPathLine) {
            this.engine.scene.remove(this.debugPathLine);
            this.debugPathLine.geometry.dispose();
            (this.debugPathLine.material as THREE.Material).dispose();
        }
        if (this.debugWaypoints) {
            this.engine.scene.remove(this.debugWaypoints);
            this.debugWaypoints.children.forEach(child => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    if (child.material instanceof THREE.Material) {
                        child.material.dispose();
                    }
                }
            });
        }

        if (path.length < 2) return;

        // Create path line
        const pathGeometry = new THREE.BufferGeometry().setFromPoints(path);
        const pathMaterial = new THREE.LineBasicMaterial({ 
            color: 0xff0000, 
            linewidth: 3,
            transparent: true,
            opacity: 0.8
        });
        
        this.debugPathLine = new THREE.Line(pathGeometry, pathMaterial);
        this.debugPathLine.name = 'PathDebug';
        this.debugPathLine.layers.set(2);
        this.engine.scene.add(this.debugPathLine);

        // Create waypoint markers
        this.debugWaypoints = new THREE.Group();
        this.debugWaypoints.name = 'WaypointDebug';
        
        const waypointGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const waypointMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 0.9
        });

        path.forEach((point, index) => {
            const marker = new THREE.Mesh(waypointGeometry.clone(), waypointMaterial.clone());
            marker.position.copy(point);
            marker.position.y += 0.1; // Slightly above the path
            this.debugWaypoints!.add(marker);
        });

        this.debugWaypoints.layers.set(2);
        this.engine.scene.add(this.debugWaypoints);
    }

    // Clear path debug visualization
    clearPath(): void {
        if (this.debugPathLine) {
            this.engine.scene.remove(this.debugPathLine);
            this.debugPathLine.geometry.dispose();
            (this.debugPathLine.material as THREE.Material).dispose();
            this.debugPathLine = null;
        }
        if (this.debugWaypoints) {
            this.engine.scene.remove(this.debugWaypoints);
            this.debugWaypoints.children.forEach(child => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    if (child.material instanceof THREE.Material) {
                        child.material.dispose();
                    }
                }
            });
            this.debugWaypoints = null;
        }
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
