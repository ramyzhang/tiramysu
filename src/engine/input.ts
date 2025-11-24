import * as THREE from 'three';
import { updatePointerPosition } from '../utils/utils.js';

/**
 * Centralized input management system.
 * Handles all window event listeners and exposes input state to other systems.
 */
export class InputManager {
    // Pointer/Mouse state
    public pointerDown: boolean = false;
    public wasPointerDown: boolean = false;
    public pointerPosition: THREE.Vector2 = new THREE.Vector2();

    // Keyboard state
    public keys: { [key: string]: boolean } = {};

    // Window state
    public windowWidth: number = window.innerWidth;
    public windowHeight: number = window.innerHeight;
    public isFocused: boolean = true;

    // Context menu callback (for right-click handling)
    private contextMenuCallback: ((event: PointerEvent) => void) | null = null;

    constructor() {
        this.setupEventListeners();
    }

    /**
     * Sets up all window event listeners once.
     */
    private setupEventListeners(): void {
        // Pointer events
        window.addEventListener('pointerdown', (e: PointerEvent) => {
            // Respond to left mouse button (desktop), or primary touch (touch/mobile)
            if (
                e.pointerType === 'touch' ||
                (e.pointerType === 'mouse' && e.button === 0) // left mouse
            ) {
                this.pointerDown = true;
                this.updatePointerPosition(e);
            }
        });

        window.addEventListener('pointerup', (e: PointerEvent) => {
            // Respond to left mouse button (desktop), or primary touch (touch/mobile)
            if (
                e.pointerType === 'touch' ||
                (e.pointerType === 'mouse' && e.button === 0) // left mouse
            ) {
                this.pointerDown = false;
            }
        });

        window.addEventListener('pointermove', (e: PointerEvent) => {
            this.wasPointerDown = this.pointerDown;
            this.updatePointerPosition(e);
        });

        // Context menu (right-click)
        window.addEventListener('contextmenu', (e: PointerEvent) => {
            e.preventDefault();
            if (this.contextMenuCallback) {
                this.contextMenuCallback(e);
            }
        });

        // Keyboard events
        window.addEventListener('keydown', (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
        });

        window.addEventListener('keyup', (e: KeyboardEvent) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Window events
        window.addEventListener('resize', () => {
            this.windowWidth = window.innerWidth;
            this.windowHeight = window.innerHeight;
        });

        window.addEventListener('blur', () => {
            this.isFocused = false;
        });

        window.addEventListener('focus', () => {
            this.isFocused = true;
        });
    }

    /**
     * Updates pointer position from a pointer event.
     */
    private updatePointerPosition(event: PointerEvent): void {
        this.pointerPosition = updatePointerPosition(event);
    }

    /**
     * Sets a callback for context menu (right-click) events.
     */
    public setContextMenuCallback(callback: (event: PointerEvent) => void): void {
        this.contextMenuCallback = callback;
    }

    /**
     * Clears the context menu callback.
     */
    public clearContextMenuCallback(): void {
        this.contextMenuCallback = null;
    }

    /**
     * Checks if a key is currently pressed.
     */
    public isKeyPressed(key: string): boolean {
        return this.keys[key.toLowerCase()] === true;
    }
}

