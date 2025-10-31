import { Engine } from '../engine/engine.js';

export abstract class System {
    protected engine: Engine;

    constructor(engine: Engine) {
        this.engine = engine;
    }

    abstract update(delta: number): void;
}

