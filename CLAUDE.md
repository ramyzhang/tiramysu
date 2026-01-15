# CLAUDE.md - Tiramysu Land Development Guide

> **Last Updated**: January 15, 2026
> **Purpose**: Comprehensive guide for AI assistants working with the Tiramysu Land codebase

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture & Design Patterns](#architecture--design-patterns)
4. [Directory Structure](#directory-structure)
5. [Code Conventions](#code-conventions)
6. [Development Workflows](#development-workflows)
7. [Key Systems](#key-systems)
8. [Entity Management](#entity-management)
9. [Common Implementation Patterns](#common-implementation-patterns)
10. [Important Considerations](#important-considerations)
11. [Debugging & Testing](#debugging--testing)

---

## Project Overview

**Tiramysu Land** is an experimental 3D interactive web experience featuring a dessert-themed world. The project combines Three.js for 3D rendering with TypeScript for type safety, implementing a custom game engine with Entity-Component-System (ECS) architecture.

### Key Features
- **Player Controller**: Point-and-click movement system (Abeto-style)
- **Physics Engine**: Capsule-based collision with BVH optimization
- **Dialogue System**: Interactive NPC conversations with UI
- **Dynamic Camera**: Player-follow and free camera modes
- **Resource Management**: Lazy loading with placeholder meshes
- **Particle Systems**: Visual effects (waterfalls, etc.)
- **Event-Driven Communication**: Decoupled system interactions

### Current State
The project is in active development. Recent work includes:
- Skybox implementation and prop additions
- Waterfall particle effects with foam
- Shader-based visual effects
- NPC character integration

---

## Tech Stack

### Core Technologies
- **TypeScript 5.8.2** - Strict type checking enabled
- **Three.js 0.174.0** - 3D graphics library
- **Vite 6.2.2** - Build tool and dev server
- **three-mesh-bvh 0.9.2** - Collision detection optimization

### Build & Development
- **Module System**: ES6 modules (Node16 resolution)
- **Target**: ES6
- **No Testing Framework**: Currently no test setup
- **No Linting**: No ESLint or Prettier configured

### Browser Requirements
- WebGL 2.0 support required
- Fallback error message for unsupported browsers

---

## Architecture & Design Patterns

### 1. Entity-Component-System (ECS) Pattern

**Entity Base Class** (`src/entities/entity.ts`):
```typescript
class Entity extends THREE.Object3D {
  entityType: EntityType;
  collider?: THREE.Mesh;
  velocity: THREE.Vector3;
  static: boolean;
}
```

**Entity Types**:
- `EntityType.Player` - Player character
- `EntityType.NPC` - Non-player characters
- `EntityType.Prop` - Static props
- `EntityType.Environment` - World geometry
- `EntityType.Interactable` - Interactive objects

**System Base Class** (`src/systems/system.ts`):
```typescript
abstract class System {
  abstract update(delta: number): void;
}
```

### 2. Resource Management Pattern

**ResourceManager** (`src/engine/resources.ts`):
- Singleton pattern for centralized asset loading
- Caching system prevents duplicate loads
- Promise-based async loading with deduplication
- Lazy loading with placeholder meshes
- Scale-in animation on mesh appearance

**Usage**:
```typescript
// Preload essential assets
await engine.resources.preloadAssets(['/models/player.glb']);

// Lazy load with placeholder
engine.resources.loadMeshIntoEntity(entity, '/models/npc.glb', layer);
```

### 3. Event-Driven Communication

**EventEmitter** (`src/utils/event-emitter.ts`):
- Type-safe generic event system
- Supports `on()`, `off()`, `once()` methods
- Used for physics collisions and interactions

**Example**:
```typescript
// Physics system emits events
physics.events.emit('collision', { entity: player, point: hitPoint });

// Interaction system listens
physics.events.on('collision', (data) => { /* handle */ });
```

### 4. Service Locator Pattern

The `Engine` instance serves as the central service locator:
- All systems receive engine reference in constructor
- Systems access shared resources through engine
- Promotes loose coupling while maintaining accessibility

**Engine provides**:
- `engine.scene` - Three.js scene
- `engine.camera` - Active camera
- `engine.input` - Input manager
- `engine.physics` - Physics engine
- `engine.resources` - Resource manager
- `engine.entityRegistry` - Entity registry
- `engine.world` - World instance

### 5. Layer-Based Rendering

Uses Three.js layer system for selective rendering:
```typescript
enum Layers {
  Navmesh = 0,
  Interactable = 1,
  NPC = 2,
  Ignore = 3,
  Environment = 4,
  Player = 5,
}
```

**Purpose**: Enables camera occlusion, collision filtering, and render optimization.

---

## Directory Structure

```
tiramysu/
├── main.ts                      # Entry point (TiramysuGame class)
├── index.html                   # HTML shell
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── .gitignore                   # Git ignore rules
├── README.md                    # User-facing documentation
├── CLAUDE.md                    # This file (AI assistant guide)
│
├── src/                         # Source code
│   ├── constants.ts             # Global constants (colors, spawn positions, layers)
│   ├── world.ts                 # World orchestrator (initializes entities/systems)
│   │
│   ├── engine/                  # Core engine
│   │   ├── engine.ts            # Main engine (renderer, scene, camera, game loop)
│   │   ├── input.ts             # Input manager (keyboard, mouse, touch)
│   │   ├── physics.ts           # Physics engine (BVH collision, gravity)
│   │   └── resources.ts         # Resource manager (asset loading, caching)
│   │
│   ├── entities/                # Game entities
│   │   ├── entity.ts            # Base Entity class
│   │   ├── entity-registry.ts   # Entity management
│   │   ├── player.ts            # Player entity (capsule collider)
│   │   ├── npc.ts               # NPC entities (dialogue bubbles)
│   │   ├── tiramysu.ts          # Main environment mesh
│   │   ├── waterfall.ts         # Waterfall entity (animated)
│   │   ├── prop.ts              # Static props
│   │   ├── interactable.ts      # Interactive objects
│   │   └── index.ts             # Barrel exports
│   │
│   ├── systems/                 # Game systems
│   │   ├── system.ts            # Base System class
│   │   ├── player-movement.ts   # Player movement logic
│   │   ├── camera.ts            # Camera positioning (Player/Free modes)
│   │   ├── physics.ts           # Physics updates
│   │   ├── interaction.ts       # Interaction detection
│   │   ├── dialogue.ts          # Dialogue display
│   │   ├── npc-movement.ts      # NPC movement
│   │   ├── camera-occlusion.ts  # Camera occlusion handling
│   │   ├── particle-system.ts   # Particle effects
│   │   ├── debug-ui.ts          # Debug overlay
│   │   └── index.ts             # Barrel exports
│   │
│   ├── dialogue/                # Dialogue system
│   │   ├── dialogue-script.ts   # Data structures
│   │   └── game-dialogues.ts    # Dialogue content database
│   │
│   ├── ui/                      # UI components
│   │   └── dialogue-box.ts      # Dialogue UI with typing indicators
│   │
│   └── utils/                   # Utilities
│       ├── event-emitter.ts     # Type-safe event system
│       └── utils.ts             # Helper functions
│
└── public/                      # Static assets
    ├── models/                  # 3D models (.glb files)
    │   ├── tiramysu-land-base.glb
    │   ├── tiramysu-land-navmesh.glb
    │   ├── tiramysu-ramy.glb    # Player model
    │   ├── tiramysu-liltao.glb  # NPC models
    │   ├── tiramysu-meimei.glb
    │   ├── tiramysu-purin.glb
    │   ├── tiramysu-dialogue-bubble.glb
    │   ├── tiramysu-waterfall.glb
    │   ├── tiramysu-theatre.glb
    │   └── tanghulu-sgs.glb
    ├── textures/                # Texture files
    │   ├── spyros-skybox.png
    │   ├── tyier-godette-waterfall.png
    │   └── tyier-godette-foam.png
    └── images/                  # Static images
        └── readme-img.png
```

---

## Code Conventions

### Naming Conventions

| Type | Convention | Examples |
|------|-----------|----------|
| **Classes** | PascalCase | `Entity`, `Player`, `PhysicsSystem` |
| **Files (Classes)** | kebab-case.ts | `player-movement.ts`, `entity-registry.ts` |
| **Functions** | camelCase | `update()`, `init()`, `loadMesh()` |
| **Private Properties** | camelCase (optionally `_prefix`) | `moveSpeed`, `_player` |
| **Constants (Global)** | PascalCase or camelCase | `PlayerSpawnPosition`, `Colours.peach` |
| **Enums** | PascalCase | `EntityType`, `CameraMode`, `Layers` |
| **Interfaces** | PascalCase | `DialogueScript`, `PhysicsEvents` |

### Import Conventions

**Always use `.js` extension in imports** (TypeScript requirement with Node16 modules):
```typescript
// Correct
import { Entity } from './entity.js';
import { Engine } from '../engine/engine.js';

// Incorrect (will fail to compile)
import { Entity } from './entity';
```

**Prefer barrel exports for cleaner imports**:
```typescript
// Instead of:
import { Player } from './entities/player.js';
import { NPC } from './entities/npc.js';

// Use:
import { Player, NPC } from './entities/index.js';
```

**Group imports by category**:
```typescript
// 1. External libraries
import * as THREE from 'three';

// 2. Engine/core
import { Engine } from './engine/engine.js';

// 3. Entities
import { Player } from './entities/index.js';

// 4. Systems
import { PhysicsSystem } from './systems/index.js';

// 5. Constants
import { Layers, PlayerSpawnPosition } from './constants.js';
```

### Code Style

**Strict TypeScript**:
- Always specify types explicitly for public APIs
- Use `strict: true` in tsconfig.json
- Avoid `any` - use `unknown` or proper types

**Class Structure**:
```typescript
export class ExampleSystem extends System {
    // 1. Private properties
    private player: Player | null = null;
    private moveSpeed: number = 5.0;

    // 2. Public properties (if necessary)
    public enabled: boolean = true;

    // 3. Constructor
    constructor(engine: Engine) {
        super(engine);
    }

    // 4. Public methods
    public update(delta: number): void {
        // ...
    }

    // 5. Private methods
    private findPlayer(): Player | null {
        // ...
    }
}
```

**Comments**:
- Use JSDoc for public APIs only
- Prefer self-documenting code over comments
- Add comments for complex algorithms or non-obvious logic
- Section comments for major divisions (e.g., `// -------------- initialize lighting --------------`)

**Error Handling**:
```typescript
// Always catch and log asset loading errors
try {
    const model = await resources.load('/models/player.glb');
} catch (error) {
    console.error('Failed to load player model:', error);
}

// Use .catch() for promise chains
engine.resources.loadMeshIntoEntity(entity, path, layer)
    .catch((error) => {
        console.error('Failed to load mesh:', error);
    });
```

---

## Development Workflows

### Setup

```bash
# Install dependencies
npm install

# Start dev server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Adding a New Entity

1. **Create entity class** in `src/entities/your-entity.ts`:
```typescript
import * as THREE from 'three';
import { Entity, EntityType } from './entity.js';
import { Engine } from '../engine/engine.js';

export class YourEntity extends Entity {
    constructor(engine: Engine, position: THREE.Vector3) {
        const mesh = new THREE.Mesh(); // Placeholder
        super(mesh, EntityType.Prop);

        this.position.copy(position);
        this.name = 'YourEntity';
    }
}
```

2. **Export from barrel** in `src/entities/index.ts`:
```typescript
export { YourEntity } from './your-entity.js';
```

3. **Spawn in world** in `src/world.ts`:
```typescript
spawn(): void {
    // ... existing entities

    const yourEntity = new YourEntity(this.engine, new THREE.Vector3(0, 0, 0));
    this.entityRegistry.add(yourEntity);

    // Optionally load mesh
    this.engine.resources.loadMeshIntoEntity(
        yourEntity,
        '/models/your-model.glb',
        Layers.Environment
    ).catch((error) => {
        console.error('Failed to load your entity:', error);
    });
}
```

### Adding a New System

1. **Create system class** in `src/systems/your-system.ts`:
```typescript
import { System } from './system.js';
import { Engine } from '../engine/engine.js';

export class YourSystem extends System {
    constructor(engine: Engine) {
        super(engine);
    }

    update(delta: number): void {
        // Your update logic here
    }
}
```

2. **Export from barrel** in `src/systems/index.ts`:
```typescript
export { YourSystem } from './your-system.js';
```

3. **Initialize in World** in `src/world.ts`:
```typescript
export class World {
    private yourSystem!: YourSystem;

    init(): void {
        // ... other systems
        this.yourSystem = new YourSystem(this.engine);
    }

    update(delta: number): void {
        // ... other updates
        this.yourSystem.update(delta);
    }
}
```

### Adding Dialogue

1. **Define dialogue script** in `src/dialogue/game-dialogues.ts`:
```typescript
export const YOUR_DIALOGUE: DialogueScript = {
    id: 'your-dialogue-id',
    name: 'Your Dialogue',
    messages: [
        { text: 'Hello! Welcome to Tiramysu Land!' },
        { text: 'I hope you enjoy your stay.', speaker: 'NPC Name' },
    ]
};
```

2. **Assign to interactable** in entity or system:
```typescript
interactable.dialogueId = 'your-dialogue-id';
```

### Adding Constants

Add to `src/constants.ts`:
```typescript
// Colors
export const Colours = {
    // ... existing colors
    yourColor: 0xFFFFFF,
}

// Spawn positions
export const YourEntitySpawnPosition = new THREE.Vector3(x, y, z);
```

---

## Key Systems

### Input System (`src/engine/input.ts`)

**Usage**:
```typescript
const input = this.engine.input;

// Mouse/touch input
if (input.pointerDown) {
    const pos = input.pointerPosition; // THREE.Vector2 (-1 to 1)
}

// Keyboard input
if (input.keys['w']) {
    // W key is pressed
}
```

**Events**:
- Automatically handles mouse down/up/move
- Automatically handles touch start/end/move
- Automatically handles keyboard down/up

### Physics System (`src/engine/physics.ts`)

**Features**:
- Capsule-triangle collision detection using BVH
- Sphere-based collision for interactables
- Gravity simulation
- Collision response and resolution
- Event emission for collision events

**Usage**:
```typescript
// Listen to collision events
this.engine.physics.events.on('collision', (data) => {
    console.log('Collision detected:', data);
});
```

**Physics properties on entities**:
```typescript
entity.velocity = new THREE.Vector3(x, y, z);
entity.static = false; // Dynamic entity (affected by physics)
```

### Camera System (`src/systems/camera.ts`)

**Modes**:
- `CameraMode.Player` - Follows player from behind
- `CameraMode.Free` - Free-look mode (toggle with 'C' key)

**Configuration**:
- Camera offset from player is configurable
- Smooth camera follow with lerp
- Prevents camera from going below certain height

### Dialogue System (`src/systems/dialogue.ts`)

**State Management**:
```typescript
// Check if dialogue is active
if (dialogueSystem.isActive()) {
    // Disable movement, etc.
}
```

**Flow**:
1. InteractionSystem detects collision with Interactable
2. InteractionSystem emits interaction event
3. DialogueSystem starts dialogue based on `dialogueId`
4. DialogueBox renders UI with typing indicators
5. Player clicks to advance or exit

---

## Entity Management

### Entity Lifecycle

1. **Creation**: Instantiate entity class
2. **Registration**: Add to EntityRegistry via `entityRegistry.add(entity)`
3. **Update**: Systems update entities each frame
4. **Removal**: Remove from EntityRegistry via `entityRegistry.remove(entity)`

### Entity Properties

**Base Entity** (`src/entities/entity.ts`):
```typescript
class Entity extends THREE.Object3D {
    entityType: EntityType;      // Type classification
    collider?: THREE.Mesh;       // Optional collision mesh
    velocity: THREE.Vector3;     // Movement velocity
    static: boolean;             // Is entity static (no physics)?
}
```

### Collision Setup

**Capsule Collider** (Player):
```typescript
class Player extends Entity {
    capsule: Capsule = new Capsule(); // radius + line segment
}
```

**Mesh Collider** (Environment):
```typescript
// BVH is automatically generated for collision meshes
// Assign to entity.collider for physics detection
```

**Sphere Collider** (Interactables):
```typescript
// InteractionSystem uses sphere-triangle intersection
// Radius is derived from bounding sphere
```

---

## Common Implementation Patterns

### Pattern 1: Finding Entities

```typescript
private findPlayer(): Player | null {
    const entities = this.engine.entityRegistry.getEntities();
    for (const entity of entities) {
        if (entity.entityType === EntityType.Player && entity instanceof Player) {
            return entity as Player;
        }
    }
    return null;
}
```

### Pattern 2: Async Asset Loading

```typescript
// Preload critical assets
await this.engine.resources.preloadAssets([
    '/models/tiramysu-land-base.glb',
    '/models/tiramysu-ramy.glb',
]);

// Lazy load non-critical assets
this.engine.resources.loadMeshIntoEntity(entity, '/models/npc.glb', Layers.NPC)
    .catch((error) => console.error('Failed to load:', error));
```

### Pattern 3: Event Communication

```typescript
// Emitter
export interface YourEvents {
    'eventName': (data: DataType) => void;
}

class YourSystem extends System {
    events = new EventEmitter<YourEvents>();

    private triggerEvent(): void {
        this.events.emit('eventName', { /* data */ });
    }
}

// Listener
yourSystem.events.on('eventName', (data) => {
    // Handle event
});
```

### Pattern 4: Respawn on Fall

```typescript
// Common pattern in movement systems
if (player.position.y < -25) {
    player.position.copy(PlayerSpawnPosition);
    player.velocity.set(0, 0, 0);
}
```

### Pattern 5: Conditional System Updates

```typescript
// Many systems check dialogue state before updating
update(delta: number): void {
    // Don't process if dialogue is active
    if (this.engine.world.dialogueSystem.isActive()) {
        return;
    }

    // Normal update logic
}
```

### Pattern 6: Layer Assignment

```typescript
// Set layers for all children of an entity
for (const child of entity.children) {
    child.layers.enable(Layers.YourLayer);
}
```

---

## Important Considerations

### Performance

1. **BVH Optimization**: The project uses `three-mesh-bvh` for fast collision detection. Always ensure large meshes have BVH computed.

2. **Lazy Loading**: Non-critical assets (NPCs, props) should be lazy-loaded to reduce initial load time.

3. **Object Pooling**: Not currently implemented, but consider for particle systems and frequently spawned objects.

4. **Pixelation Effect**: The engine uses a scaled render target for pixelated look. This is a performance tradeoff (lower resolution = better performance).

### Physics

1. **Capsule vs Sphere**: Player uses capsule collider for better character controller feel. Interactables use sphere for simpler detection.

2. **Gravity**: Applied in PhysicsSystem at `-9.8` units per second squared. Adjust `weight` property on entities to change fall speed.

3. **Collision Layers**: Not all entities should collide with everything. Use layers to filter collision checks.

### Camera

1. **Occlusion**: CameraOcclusionSystem handles objects between camera and player. Objects fade or move.

2. **Camera Modes**: Free camera mode is useful for debugging. Toggle with 'C' key.

### Dialogue

1. **State Management**: Dialogue system disables player movement when active. Always check `dialogueSystem.isActive()` in movement systems.

2. **Auto-advance**: Dialogue currently requires click to advance. No auto-advance timer.

### Assets

1. **Model Format**: All 3D models are `.glb` format (binary GLTF).

2. **Texture Format**: Textures are `.png` format.

3. **Asset Paths**: Always use absolute paths from public root (e.g., `/models/file.glb`, not `../public/models/file.glb`).

4. **Missing Assets**: ResourceManager shows placeholder meshes for missing/loading assets. Don't block on asset loads.

### Type Safety

1. **Strict Mode**: Project uses strict TypeScript. Always specify types.

2. **Three.js Types**: Use `@types/three` for proper typing. Import types as needed:
```typescript
import * as THREE from 'three';
```

3. **Entity Type Guards**: Use `instanceof` checks when casting:
```typescript
if (entity instanceof Player) {
    // Now TypeScript knows entity is Player
    entity.capsule.radius = 0.5;
}
```

---

## Debugging & Testing

### Debug UI

**DebugUI** (`src/systems/debug-ui.ts`):
- Overlay with FPS counter
- Entity count
- Player position
- Camera mode
- Other debug info

**Toggle**: Usually visible in development, hidden in production.

### Console Logging

The codebase uses `console.error()` for error logging and `console.log()` for debug info. Add logging strategically:
```typescript
console.error('Failed to load asset:', error);
console.log('Player spawned at:', player.position);
```

### Testing

**No test framework currently installed**. To add testing:
1. Install test framework (e.g., Vitest, Jest)
2. Create `tests/` directory
3. Write unit tests for systems/entities
4. Add `test` script to `package.json`

### Common Issues

**Issue**: Assets not loading
- Check console for 404 errors
- Verify asset paths use absolute paths from `/public`
- Check if file exists in `/public/models` or `/public/textures`

**Issue**: Collision not working
- Verify entity has `collider` property set
- Check if BVH is computed for mesh
- Verify layers are correct

**Issue**: Player falling through floor
- Ensure environment entity has `static: true`
- Check if navmesh/collision mesh is loaded
- Verify BVH is computed for collision geometry

**Issue**: TypeScript errors on build
- Check for missing `.js` extensions in imports
- Verify all types are properly imported from `three`
- Run `npm run build` to see full error output

---

## Git Workflow

### Branching

- **Main Branch**: `main` (or `master`)
- **Feature Branches**: Use descriptive names (e.g., `feature/new-npc`, `fix/collision-bug`)
- **Claude Branches**: Claude AI uses branches prefixed with `claude/` (e.g., `claude/claude-md-mkfyxlrfphy282n4-C4I7i`)

### Commit Messages

Recent commit style:
```
skybox and more props
particles for the waterfall
added foam
some waterfall tweaks
added waterfall shader
```

**Convention**: Lowercase, imperative mood, concise descriptions.

### Git Ignore

The project ignores:
- `node_modules/` - Dependencies
- `dist/` - Build output
- `.vite/` - Vite cache
- `*.tsbuildinfo` - TypeScript build info
- IDE files (`.vscode/`, `.idea/`)
- System files (`.DS_Store`, `Thumbs.db`)

---

## Future Enhancements

From `README.md` to-do list:
- [ ] Implement diegetic UI popups for content
- [ ] Scene management (theatre vs. world)
- [ ] GUI (links, pose mode, mute)
- [ ] Loading screen improvements
- [ ] Message in a bottle system
- [ ] Animations (character animations, prop animations)
- [ ] Fix texture sizing for environment
- [ ] Add OnGround check and put jumping back in
- [ ] Enhanced shaders for water
- [ ] Synthesizers with Web Audio API for SFX and ambience

---

## Resources & References

### Three.js Documentation
- [Official Docs](https://threejs.org/docs/)
- [Examples](https://threejs.org/examples/)
- [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)

### Vite
- [Vite Documentation](https://vitejs.dev/)
- [Vite + TypeScript](https://vitejs.dev/guide/features.html#typescript)

---

## AI Assistant Guidelines

### When Making Changes

1. **Always read files before editing** - Never assume file contents
2. **Follow existing patterns** - Match the codebase style
3. **Use TypeScript strictly** - No `any` types
4. **Test locally** - Run `npm run dev` and verify changes
5. **Update this file** - Keep CLAUDE.md current with significant changes

### When Adding Features

1. **Plan architecture first** - Consider ECS pattern
2. **Create minimal implementation** - Don't over-engineer
3. **Follow naming conventions** - Match existing code
4. **Add error handling** - Catch and log errors
5. **Update documentation** - Add comments for complex logic

### When Fixing Bugs

1. **Reproduce the issue** - Understand the problem
2. **Check related systems** - Consider side effects
3. **Test thoroughly** - Verify fix doesn't break other features
4. **Add logging** - Help debug future issues

### What to Avoid

- Don't modify `package.json` without discussion
- Don't add dependencies without justification
- Don't change core engine architecture without planning
- Don't remove features without confirmation
- Don't ignore TypeScript errors

---

## Questions?

For questions or clarifications:
1. Check this file first
2. Review relevant source files
3. Check Three.js documentation
4. Ask the user for guidance

---

**Happy coding!** 🍰
