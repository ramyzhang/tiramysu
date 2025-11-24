import * as THREE from 'three';
import { Engine } from '../engine/engine.js';
import { Layers } from '../constants.js';
import { EventEmitter } from '../utils/event-emitter.js';
import { Entity, EntityType } from '../entities/entity.js';
import { NPC, Interactable } from '../entities/index.js';

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
}

/**
 * System that handles interactions with interactable entities.
 * Listens to physics collision events and handles click interactions.
 */
interface DialogueBubbleAnimation {
    startScale: number;
    targetScale: number;
    duration: number;
    elapsed: number;
}

export class InteractionSystem extends EventEmitter<InteractionEvents> {
    protected engine: Engine;
    private collidingInteractables: Set<Interactable> = new Set();
    private raycaster: THREE.Raycaster = new THREE.Raycaster();
    private mouse: THREE.Vector2 = new THREE.Vector2();
    private isInteracting: boolean = false;
    private wasPointerDown: boolean = false;
    private dialogueBubbleAnimations: Map<NPC, DialogueBubbleAnimation> = new Map();
    private readonly animationDuration: number = 0.3; // Animation duration in seconds

    private readonly interactableTypesMask: EntityType = EntityType.Interactable | EntityType.NPC;

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
                this.onEnterCollision(data.entity as Interactable);
            } else {
                // Exiting collision
                this.collidingInteractables.delete(data.entity as Interactable);
                this.onExitCollision(data.entity as Interactable);
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

        // Update dialogue bubble animations
        this.updateDialogueBubbleAnimations(delta);

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

                if ((entityType & this.interactableTypesMask) !== 0) {
                    this.isInteracting = true;
                    this.handleInteraction(intersect.object.parent as Interactable);
                    // Emit event for other systems (like dialogue)
                    this.emit('interactableClicked', {
                        interactable: intersect.object.parent as Interactable
                    });
                    break;
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

    /**
     * Updates all active dialogue bubble scale animations.
     */
    private updateDialogueBubbleAnimations(delta: number): void {
        for (const [npc, animation] of this.dialogueBubbleAnimations.entries()) {
            animation.elapsed += delta;
            const progress = Math.min(animation.elapsed / animation.duration, 1.0);
            
            // Use ease-out cubic for smooth animation
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const currentScale = animation.startScale + (animation.targetScale - animation.startScale) * easedProgress;
            
            // Apply scale to dialogue bubble
            if (npc.dialogueBubble) {
                npc.dialogueBubble.scale.set(
                    currentScale,
                    currentScale,
                    currentScale
                );
                
                // Make visible when scale > 0, invisible when scale = 0
                npc.dialogueBubble.visible = currentScale > 0.01;
            }
            
            // Remove completed animations
            if (progress >= 1.0) {
                // Ensure final scale is exactly target scale
                if (npc.dialogueBubble) {
                    npc.dialogueBubble.scale.set(
                        animation.targetScale,
                        animation.targetScale,
                        animation.targetScale
                    );
                    npc.dialogueBubble.visible = animation.targetScale > 0.01;
                }
                this.dialogueBubbleAnimations.delete(npc);
            }
        }
    }

    /**
     * Starts a scale animation for a dialogue bubble.
     */
    private animateDialogueBubble(npc: NPC, targetScale: number): void {
        // Get current scale from active animation or from the bubble itself
        const existingAnimation = this.dialogueBubbleAnimations.get(npc);
        const startScale = existingAnimation 
            ? (existingAnimation.startScale + (existingAnimation.targetScale - existingAnimation.startScale) * 
               Math.min(existingAnimation.elapsed / existingAnimation.duration, 1.0))
            : (npc.dialogueBubble ? npc.dialogueBubble.scale.x : 0);
        
        this.dialogueBubbleAnimations.set(npc, {
            startScale,
            targetScale,
            duration: this.animationDuration,
            elapsed: 0
        });
        
        // Make visible immediately when scaling up
        if (targetScale > 0 && npc.dialogueBubble) {
            npc.dialogueBubble.visible = true;
        }
    }

    private onEnterCollision(entity: Interactable): void {
        if (entity.entityType === EntityType.NPC) {
            const npc = entity as NPC;
            this.animateDialogueBubble(npc, 1.0);
        }
    }

    private onExitCollision(entity: Interactable): void {
        if (entity.entityType === EntityType.NPC) {
            const npc = entity as NPC;
            this.animateDialogueBubble(npc, 0.0);
        }
    }
}

