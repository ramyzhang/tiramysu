/**
 * Type-safe Event Emitter implementation.
 * Allows classes to emit typed events that other systems can listen to.
 * 
 * @example
 * ```typescript
 * interface MyEvents {
 *   'collision': { entity1: Entity, entity2: Entity };
 *   'groundStateChanged': { isOnGround: boolean };
 * }
 * 
 * class Physics extends EventEmitter<MyEvents> {
 *   onCollision() {
 *     this.emit('collision', { entity1, entity2 });
 *   }
 * }
 * 
 * physics.on('collision', (data) => {
 *   console.log('Collision!', data.entity1, data.entity2);
 * });
 * ```
 */
export class EventEmitter<T extends Record<string, any> = Record<string, any>> {
    private listeners: Map<keyof T, Set<(data: any) => void>> = new Map();

    /**
     * Register a listener for a specific event.
     * @param event The event name to listen to
     * @param callback The callback function to call when the event is emitted
     * @returns A function to unsubscribe
     */
    public on<K extends keyof T>(event: K, callback: (data: T[K]) => void): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);

        // Return unsubscribe function
        return () => {
            this.off(event, callback);
        };
    }

    /**
     * Register a one-time listener for a specific event.
     * The listener will be automatically removed after being called once.
     */
    public once<K extends keyof T>(event: K, callback: (data: T[K]) => void): void {
        const wrappedCallback = (data: T[K]) => {
            callback(data);
            this.off(event, wrappedCallback);
        };
        this.on(event, wrappedCallback);
    }

    /**
     * Remove a listener for a specific event.
     */
    public off<K extends keyof T>(event: K, callback: (data: T[K]) => void): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.delete(callback);
            if (eventListeners.size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    /**
     * Emit an event, calling all registered listeners.
     */
    protected emit<K extends keyof T>(event: K, data: T[K]): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach(callback => {
                callback(data);
            });
        }
    }

    /**
     * Remove all listeners for a specific event, or all events if no event is specified.
     */
    public removeAllListeners<K extends keyof T>(event?: K): void {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }

    /**
     * Get the number of listeners for a specific event.
     */
    public listenerCount<K extends keyof T>(event: K): number {
        return this.listeners.get(event)?.size ?? 0;
    }
}

