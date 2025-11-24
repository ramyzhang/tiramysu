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
 * Dialogue bubble animation state.
 */
interface DialogueBubbleAnimation {
    startScale: number;
    targetScale: number;
    duration: number;
    elapsed: number;
    npc: NPC;
}

/**
 * System that handles interactions with interactable entities.
 * Listens to physics collision events and handles click interactions.
 */
export class InteractionSystem extends EventEmitter<InteractionEvents> {
    // Core system properties
    protected engine: Engine;
    private raycaster: THREE.Raycaster = new THREE.Raycaster();
    private mouse: THREE.Vector2 = new THREE.Vector2();

    // Interaction state
    private collidingInteractables: Set<Interactable> = new Set();
    private hoveredInteractable: Interactable | null = null;
    private isInteracting: boolean = false;
    private wasPointerDown: boolean = false;

    // Dialogue bubble animation
    private dialogueBubbleAnimation: DialogueBubbleAnimation | null = null;
    private readonly animationDuration: number = 0.3;

    // Hover animation
    private hoveredInteractableBaseRotation: number = 0;
    private hoverAnimationTime: number = 0;
    private readonly hoverRotationAmplitude: number = 0.15;
    private readonly hoverAnimationSpeed: number = 10.0;

    constructor(engine: Engine) {
        super();
        this.engine = engine;
        this.setupPhysicsListener();

        this.raycaster.layers.enable(Layers.Interactable);
        this.raycaster.layers.enable(Layers.NPC);
        this.raycaster.firstHitOnly = false;
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

        // Update animations
        this.updateDialogueBubbleAnimation(delta);
        this.updateHoverAnimation(delta);

        // Perform raycast
        this.mouse.copy(input.pointerPosition);
        this.raycaster.setFromCamera(this.mouse, this.engine.camera);
        const intersects = this.raycaster.intersectObjects(this.engine.entityRegistry.getEntities());

        // Update hover state
        this.updateHoverState(intersects);

        // Handle click interactions
        this.handleClickInteraction(input, intersects);
    }

    // ============================================================================
    // Collision Event Handlers
    // ============================================================================

    private onEnterCollision(entity: Interactable): void {
        if (entity.entityType === EntityType.NPC) {
            const npc = entity as NPC;
            this.startDialogueBubbleAnimation(npc, 1.0);
        }
    }

    private onExitCollision(entity: Interactable): void {
        if (entity.entityType === EntityType.NPC) {
            const npc = entity as NPC;
            this.startDialogueBubbleAnimation(npc, 0.0);
        }
    }

    // ============================================================================
    // Dialogue Bubble Animation
    // ============================================================================

    /**
     * Starts a scale animation for a dialogue bubble.
     */
    private startDialogueBubbleAnimation(npc: NPC, targetScale: number): void {
        const currentScale = npc.dialogueBubble ? npc.dialogueBubble.scale.x : 0;
        
        this.dialogueBubbleAnimation = {
            startScale: currentScale,
            targetScale,
            duration: this.animationDuration,
            elapsed: 0,
            npc
        };
        
        // Make visible immediately when scaling up
        if (targetScale > 0 && npc.dialogueBubble) {
            npc.dialogueBubble.visible = true;
        }
    }

    /**
     * Updates the dialogue bubble scale animation.
     */
    private updateDialogueBubbleAnimation(delta: number): void {
        if (!this.dialogueBubbleAnimation) return;

        const animation = this.dialogueBubbleAnimation;
        animation.elapsed += delta;
        const progress = Math.min(animation.elapsed / animation.duration, 1.0);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentScale = animation.startScale + (animation.targetScale - animation.startScale) * easedProgress;

        if (animation.npc.dialogueBubble) {
            animation.npc.dialogueBubble.scale.set(currentScale, currentScale, currentScale);
            animation.npc.dialogueBubble.visible = currentScale > 0.01;
        }

        // Clean up completed animation
        if (progress >= 1.0) {
            if (animation.npc.dialogueBubble) {
                animation.npc.dialogueBubble.scale.set(
                    animation.targetScale,
                    animation.targetScale,
                    animation.targetScale
                );
                animation.npc.dialogueBubble.visible = animation.targetScale > 0.01;
            }
            this.dialogueBubbleAnimation = null;
        }
    }

    // ============================================================================
    // Hover Animation
    // ============================================================================

    /**
     * Updates which Interactable is currently being hovered.
     */
    private updateHoverState(intersects: THREE.Intersection[]): void {
        const newHoveredInteractable = this.getInteractableFromIntersection(intersects);

        // If hover target changed, restore previous and store new base rotation
        if (this.hoveredInteractable !== newHoveredInteractable) {
            if (this.hoveredInteractable) {
                this.hoveredInteractable.rotation.z = this.hoveredInteractableBaseRotation;
                this.hoveredInteractable.updateMatrixWorld();
            }

            this.hoveredInteractable = newHoveredInteractable;
            
            if (this.hoveredInteractable) {
                this.hoveredInteractableBaseRotation = this.hoveredInteractable.rotation.z;
            }
        }
    }

    /**
     * Updates hover rotation animation for the currently hovered Interactable.
     */
    private updateHoverAnimation(delta: number): void {
        this.hoverAnimationTime += delta * this.hoverAnimationSpeed;

        if (this.hoveredInteractable) {
            const rotationOffset = Math.sin(this.hoverAnimationTime) * this.hoverRotationAmplitude;
            this.hoveredInteractable.rotation.z = this.hoveredInteractableBaseRotation + rotationOffset;
            this.hoveredInteractable.updateMatrixWorld();
        }
    }

    // ============================================================================
    // Raycasting & Interaction
    // ============================================================================

    /**
     * Handles click interactions with Interactables.
     */
    private handleClickInteraction(input: any, intersects: THREE.Intersection[]): void {
        const isNewClick = input.pointerDown && !this.wasPointerDown;
        this.wasPointerDown = input.pointerDown;

        if (isNewClick && this.collidingInteractables.size > 0 && this.hoveredInteractable) {
            this.isInteracting = true;
            this.emit('interactableClicked', {
                interactable: this.hoveredInteractable
            });
        } else if (!input.pointerDown) {
            this.isInteracting = false;
        }
    }

    /**
     * Gets the Interactable from the first raycast intersection, if any.
     */
    private getInteractableFromIntersection(intersects: THREE.Intersection[]): Interactable | null {
        if (intersects.length === 0) return null;

        const intersect = intersects[0];
        const object = intersect.object as Entity;
        const entityType = this.getEntityType(object);

        if (entityType === EntityType.Interactable) {
            return (object.parent || object) as Interactable;
        }

        return null;
    }

    /**
     * Recursively finds the entity type of an object or its parent.
     */
    private getEntityType(object: THREE.Object3D | null): EntityType {
        if (object === null) {
            return EntityType.None;
        }

        if (object instanceof Entity) {
            return object.entityType;
        }

        return this.getEntityType(object.parent as THREE.Object3D);
    }
}

