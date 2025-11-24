import * as THREE from 'three';
import { Engine } from '../engine/engine.js';
import { Interactable } from '../entities/interactable.js';
import { Layers } from '../constants.js';
import { EventEmitter } from '../utils/event-emitter.js';
import { Entity, EntityType } from '../entities/entity.js';

/**
 * Interaction event types.
 */
export interface InteractionEvents {
    /**
     * Emitted when an interactable is clicked.
     */
    'interactableClicked': {
        interactable: Interactable;
    };

    'interactableEntered': {
        interactable: Interactable;
    };

    'interactableExited': {
        interactable: Interactable;
    };
}

/**
 * System that handles interactions with interactable entities.
 * Listens to physics collision events and handles click interactions.
 */
export class InteractionSystem extends EventEmitter<InteractionEvents> {
    protected engine: Engine;
    private collidingInteractables: Set<Interactable> = new Set();
    private raycaster: THREE.Raycaster = new THREE.Raycaster();
    private mouse: THREE.Vector2 = new THREE.Vector2();
    private isInteracting: boolean = false;
    private wasPointerDown: boolean = false;

    constructor(engine: Engine) {
        super();
        this.engine = engine;
        this.setupPhysicsListener();
    }

    /**
     * Sets up listener for physics interactable collision events.
     */
    private setupPhysicsListener(): void {
        this.engine.physics.on('interactableCollision', (data) => {
            if (data.isColliding) {
                // Entering collision
                this.collidingInteractables.add(data.entity as Interactable);
                this.emit('interactableEntered', {
                    interactable: data.entity as Interactable
                });
            } else {
                // Exiting collision
                this.collidingInteractables.delete(data.entity as Interactable);
                this.emit('interactableExited', {
                    interactable: data.entity as Interactable
                });
            }
        });
    }

    /**
     * Checks if the player is currently interacting (clicking on an interactable).
     * This can be used by other systems to prioritize interaction over movement.
     */
    public isCurrentlyInteracting(): boolean {
        return this.isInteracting;
    }

    /**
     * Gets the set of interactables the player is currently colliding with.
     */
    public getCollidingInteractables(): Set<Interactable> {
        return this.collidingInteractables;
    }

    update(delta: number): void {
        const input = this.engine.input;

        // Check for click on interactable (only if player is colliding with at least one)
        const isNewClick = input.pointerDown && !this.wasPointerDown;
        this.wasPointerDown = input.pointerDown;
        
        if (isNewClick && this.collidingInteractables.size > 0) {
            this.wasPointerDown = input.pointerDown;
            this.mouse.copy(input.pointerPosition);

            this.raycaster.layers.disableAll();
            this.raycaster.layers.enable(Layers.Interactable);
            this.raycaster.layers.enable(Layers.NPC);
            this.raycaster.firstHitOnly = false;
            this.raycaster.setFromCamera(this.mouse, this.engine.camera);

            const intersects = this.raycaster.intersectObjects(this.engine.entityRegistry.getEntities());

            for (const intersect of intersects) {
                // check if the object or its parent is an interactable
                const object = intersect.object as Entity;
                const entityType = this.getEntityType(object);

                if (entityType === EntityType.Interactable || entityType === EntityType.NPC) {
                    console.log("Intersecting with", intersect.object.name);

                    this.isInteracting = true;
                    this.handleInteraction(intersect.object.parent as Interactable);
                    // Emit event for other systems (like dialogue)
                    this.emit('interactableClicked', {
                        interactable: intersect.object.parent as Interactable
                    });
                }
            }
            
            if (intersects.length === 0) {
                this.isInteracting = false;
            }
        }
        else if (!input.pointerDown) {
            this.isInteracting = false;
        }
    }

    /**
     * Handles interaction with an interactable entity.
     */
    private handleInteraction(interactable: Interactable): void {
        (interactable as THREE.Object3D as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
        // TODO: Add interaction logic here (open UI, trigger dialogue, etc.)
    }

    // recursive helper function to get the entity type of an object or its parent
    private getEntityType(object: THREE.Object3D): EntityType {
        if (object === null) {
            return EntityType.None;
        }

        if (object instanceof Entity) {
            return object.entityType;
        }

        return this.getEntityType(object.parent as THREE.Object3D);
    }
}

