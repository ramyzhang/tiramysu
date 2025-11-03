import { System } from './system.js';
import { Engine } from '../engine/engine.js';
import * as THREE from 'three';
import { Entity, EntityType } from '../entities/entity.js';

// Constants for text texture generation
const TEXT_TEXTURE_CONFIG = {
    FONT_SIZE: 48,
    PADDING: 20,
    LINE_HEIGHT_MULTIPLIER: 1.2,
    BACKGROUND_COLOR: 'rgba(0, 0, 0, 0.7)',
    TEXT_COLOR: '#ffffff',
    FONT_FAMILY: 'monospace',
} as const;

// Constants for sprite scaling
const SPRITE_CONFIG = {
    BASE_SCALE: 0.005,
    Y_OFFSET: 2, // Offset above entity position
} as const;

// Constants for debug overlay
const DEBUG_OVERLAY_STYLE = {
    POSITION: 'fixed',
    TOP: '10px',
    LEFT: '10px',
    COLOR: '#ffffff',
    FONT_FAMILY: 'monospace',
    FONT_SIZE: '14px',
    BACKGROUND_COLOR: 'rgba(0, 0, 0, 0.5)',
    PADDING: '8px',
    BORDER_RADIUS: '4px',
    Z_INDEX: '1000',
    POINTER_EVENTS: 'none',
} as const;

// Constants for position formatting
const POSITION_FORMAT = {
    DECIMAL_PLACES: 2,
    DEFAULT_ENTITY_NAME: 'Unnamed Entity',
} as const;

export class DebugUI extends System {
    private debugElement: HTMLDivElement | null = null;
    private entityLabels: Map<Entity, THREE.Sprite> = new Map();

    constructor(engine: Engine) {
        super(engine);
        this.setupDebugUI();
        this.createWorldPositionLabels();
    }

    update(delta: number): void {
        this.updateCameraPositionText();
        this.updateEntityLabels();
    }

    private setupDebugUI(): void {
        // Create debug overlay element for camera position
        this.debugElement = document.createElement('div');
        this.debugElement.id = 'debug-ui';
        
        // Apply styles from constants
        Object.assign(this.debugElement.style, {
            position: DEBUG_OVERLAY_STYLE.POSITION,
            top: DEBUG_OVERLAY_STYLE.TOP,
            left: DEBUG_OVERLAY_STYLE.LEFT,
            color: DEBUG_OVERLAY_STYLE.COLOR,
            fontFamily: DEBUG_OVERLAY_STYLE.FONT_FAMILY,
            fontSize: DEBUG_OVERLAY_STYLE.FONT_SIZE,
            backgroundColor: DEBUG_OVERLAY_STYLE.BACKGROUND_COLOR,
            padding: DEBUG_OVERLAY_STYLE.PADDING,
            borderRadius: DEBUG_OVERLAY_STYLE.BORDER_RADIUS,
            zIndex: DEBUG_OVERLAY_STYLE.Z_INDEX,
            pointerEvents: DEBUG_OVERLAY_STYLE.POINTER_EVENTS,
        });
        
        document.body.appendChild(this.debugElement);
    }

    /**
     * Calculates the dimensions needed for the canvas based on text.
     */
    private calculateCanvasDimensions(text: string, context: CanvasRenderingContext2D): { width: number; height: number } {
        const lines = text.split('\n');
        const lineHeight = TEXT_TEXTURE_CONFIG.FONT_SIZE * TEXT_TEXTURE_CONFIG.LINE_HEIGHT_MULTIPLIER;
        
        // Find the maximum width among all lines
        let textWidth = 0;
        lines.forEach(line => {
            const metrics = context.measureText(line);
            textWidth = Math.max(textWidth, metrics.width);
        });
        
        const totalHeight = lines.length * lineHeight;
        
        return {
            width: textWidth + TEXT_TEXTURE_CONFIG.PADDING * 2,
            height: totalHeight + TEXT_TEXTURE_CONFIG.PADDING * 2,
        };
    }

    /**
     * Sets up the canvas context with text styling.
     */
    private setupCanvasContext(context: CanvasRenderingContext2D): void {
        const font = `bold ${TEXT_TEXTURE_CONFIG.FONT_SIZE}px ${TEXT_TEXTURE_CONFIG.FONT_FAMILY}`;
        context.font = font;
        context.fillStyle = TEXT_TEXTURE_CONFIG.TEXT_COLOR;
        context.textAlign = 'left';
        context.textBaseline = 'top';
    }

    /**
     * Draws the text onto the canvas.
     */
    private drawTextOnCanvas(context: CanvasRenderingContext2D, text: string): void {
        const lines = text.split('\n');
        const lineHeight = TEXT_TEXTURE_CONFIG.FONT_SIZE * TEXT_TEXTURE_CONFIG.LINE_HEIGHT_MULTIPLIER;
        
        lines.forEach((line, index) => {
            context.fillText(
                line,
                TEXT_TEXTURE_CONFIG.PADDING,
                TEXT_TEXTURE_CONFIG.PADDING + index * lineHeight
            );
        });
    }

    /**
     * Creates a canvas texture with text for use on sprites.
     */
    private createTextTexture(text: string): THREE.CanvasTexture {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
            throw new Error('Could not get canvas context');
        }

        // Setup context for measuring
        const font = `bold ${TEXT_TEXTURE_CONFIG.FONT_SIZE}px ${TEXT_TEXTURE_CONFIG.FONT_FAMILY}`;
        context.font = font;
        
        // Calculate dimensions
        const dimensions = this.calculateCanvasDimensions(text, context);
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        
        // Clear and set background
        context.fillStyle = TEXT_TEXTURE_CONFIG.BACKGROUND_COLOR;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Setup context for drawing
        this.setupCanvasContext(context);
        
        // Draw text
        this.drawTextOnCanvas(context, text);
        
        // Create texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        return texture;
    }

    /**
     * Formats entity name and position into display text.
     */
    private formatPositionText(entity: Entity): string {
        const entityName = entity.name || POSITION_FORMAT.DEFAULT_ENTITY_NAME;
        const pos = entity.position;
        const precision = POSITION_FORMAT.DECIMAL_PLACES;
        return `${entityName}\n(${pos.x.toFixed(precision)}, ${pos.y.toFixed(precision)}, ${pos.z.toFixed(precision)})`;
    }

    /**
     * Creates a sprite material for entity labels.
     */
    private createSpriteMaterial(texture: THREE.CanvasTexture): THREE.SpriteMaterial {
        return new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false,
            depthWrite: false,
        });
    }

    /**
     * Updates sprite scale to match texture dimensions while preserving aspect ratio.
     */
    private updateSpriteScale(sprite: THREE.Sprite, texture: THREE.CanvasTexture): void {
        const textureWidth = texture.image.width;
        const textureHeight = texture.image.height;
        sprite.scale.set(
            textureWidth * SPRITE_CONFIG.BASE_SCALE,
            textureHeight * SPRITE_CONFIG.BASE_SCALE,
            1
        );
    }

    /**
     * Positions a sprite above an entity.
     */
    private positionSpriteAboveEntity(sprite: THREE.Sprite, entity: Entity): void {
        sprite.position.copy(entity.position);
        sprite.position.y += SPRITE_CONFIG.Y_OFFSET;
    }

    /**
     * Creates a sprite label for an entity.
     */
    private createEntityLabelSprite(entity: Entity): THREE.Sprite {
        const text = this.formatPositionText(entity);
        const texture = this.createTextTexture(text);
        const material = this.createSpriteMaterial(texture);
        const sprite = new THREE.Sprite(material);
        
        this.positionSpriteAboveEntity(sprite, entity);
        this.updateSpriteScale(sprite, texture);
        
        return sprite;
    }

    /**
     * Creates world position labels for entities that display the entity's name and position.
     * This method creates THREE.js sprite labels that are positioned in 3D space above entities.
     */
    createWorldPositionLabels(): void {
        const entities = this.engine.entityRegistry.getEntities();
        
        entities.forEach(entity => {
            // Skip if label already exists
            if (this.entityLabels.has(entity)) {
                return;
            }

            const sprite = this.createEntityLabelSprite(entity);
            
            // Add sprite to scene
            this.engine.scene.add(sprite);
            this.entityLabels.set(entity, sprite);
        });
    }

    /**
     * Updates the camera position text in the debug overlay.
     */
    private updateCameraPositionText(): void {
        if (!this.debugElement) {
            return;
        }

        const camera = this.engine.camera;
        const pos = camera.position;
        const precision = POSITION_FORMAT.DECIMAL_PLACES;
        
        const x = pos.x.toFixed(precision);
        const y = pos.y.toFixed(precision);
        const z = pos.z.toFixed(precision);
        
        this.debugElement.textContent = `Camera Position:\nX: ${x}\nY: ${y}\nZ: ${z}`;
    }

    /**
     * Updates a single entity label sprite.
     */
    private updateEntityLabel(entity: Entity, sprite: THREE.Sprite): void {
        // Update sprite position to follow entity
        this.positionSpriteAboveEntity(sprite, entity);

        // Make sprite face camera (billboard behavior)
        sprite.lookAt(this.engine.camera.position);

        // Update texture with current position
        const text = this.formatPositionText(entity);
        
        // Dispose old texture
        if (sprite.material instanceof THREE.SpriteMaterial && sprite.material.map) {
            sprite.material.map.dispose();
        }
        
        // Create new texture with updated text
        const newTexture = this.createTextTexture(text);
        if (sprite.material instanceof THREE.SpriteMaterial) {
            sprite.material.map = newTexture;
            sprite.material.needsUpdate = true;
            this.updateSpriteScale(sprite, newTexture);
        }
    }

    /**
     * Disposes of a sprite and its associated resources.
     */
    private disposeSprite(sprite: THREE.Sprite): void {
        if (sprite.material instanceof THREE.SpriteMaterial && sprite.material.map) {
            sprite.material.map.dispose();
        }
        sprite.material.dispose();
        this.engine.scene.remove(sprite);
    }

    /**
     * Removes labels for entities that no longer exist in the registry.
     */
    private cleanupRemovedEntityLabels(currentEntities: Set<Entity>): void {
        for (const [entity, sprite] of this.entityLabels.entries()) {
            if (!currentEntities.has(entity)) {
                this.disposeSprite(sprite);
                this.entityLabels.delete(entity);
            }
        }
    }

    private updateEntityLabels(): void {
        const entities = this.engine.entityRegistry.getEntities();
        const currentEntities = new Set(entities);
        
        entities.forEach(entity => {
            const sprite = this.entityLabels.get(entity);
            if (!sprite) {
                return;
            }

            this.updateEntityLabel(entity, sprite);
        });

        this.cleanupRemovedEntityLabels(currentEntities);
    }

    dispose(): void {
        if (this.debugElement) {
            document.body.removeChild(this.debugElement);
            this.debugElement = null;
        }

        // Remove all entity labels and dispose resources
        this.entityLabels.forEach(sprite => {
            this.disposeSprite(sprite);
        });
        this.entityLabels.clear();
    }
}

