# Sctructure

## Project Overview
This is a collaborative whiteboard application built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**. The core whiteboard logic is a custom engine located in `src/core`, rendering via **CanvasKit (Skia)**.

## Architecture & Core Concepts

### 1. The Whiteboard Engine (`src/core`)
The application logic is centralized in the `Engine` class, which orchestrates rendering, input handling, and services.
- **Entry Point:** `src/core/engine/Engine.ts` initializes the `Canvas`, `Stage`, and `ServiceManager`.
- **Rendering:** `src/core/canvas/Canvas.ts` wraps CanvasKit. Rendering logic is split into renderers (e.g., `UpperCanvasRenderer`).
- **Services:** Business logic is encapsulated in services (e.g., `SelectionService`, `ToolService`) managed by `ServiceManager`.
  - **Pattern:** Access services via `engine.serviceManager.get<ServiceType>('serviceName')`.
- **Widgets:** All board elements extend `Widget` (`src/core/shapes/Widget.ts`). Geometric shapes extend `Shape`.
- **Signals:** Internal event communication uses the `Signal` class (`src/core/signal/Signal.ts`) instead of native DOM events.

### 2. Command Pattern
All actions that modify the board state (create, delete, move, style) MUST be implemented as Commands to support undo/redo and consistency.
- **Location:** `src/core/command/`
- **Implementation:** Extend the abstract `Command` class.
- **Execution:** Dispatch commands via `CommandRegistry` or `Engine`.

### 3. State Management
- **React UI State:** Managed by **Zustand** (`src/store`). The store is composed of multiple slices (`UserSlice`, `ToolSlice`, etc.).
- **Engine State:** The `Engine` maintains its own state (widgets, selection, canvas transform) independent of React.
- **Bridge:** React components subscribe to `Engine` signals or Zustand store updates to reflect changes.

### 4. Real-time Collaboration
- **Websockets:** Handled by `WsEngine` (`src/core/WsEngine.ts`).
- **Protocol:** Custom message types defined in `src/types/Websocket.ts`.
- **Sync:** Updates are broadcasted to peers. `CollaboratorsRenderer` handles drawing remote cursors.

## Developer Workflows

### Build & Run
- **Dev Server:** `pnpm dev` (Vite)
- **Build:** `pnpm build` (TSC + Vite build)
- **Lint:** `pnpm lint`

### Testing
- **Status:** No automated testing infrastructure is currently set up. Focus on manual verification and defensive coding.

## Coding Conventions

### Styling
- Use **Tailwind CSS** for styling React components.
- Use **Shadcn/UI** components (`src/components/ui`) for common UI elements.
- Canvas styling is handled programmatically within renderers.

### TypeScript
- Strict type safety is enforced.
- Use defined types in `src/types/` and component-specific interfaces.
- Avoid `any`; use `unknown` or specific types.

### Best Practices
- **Decoupling:** Keep React components thin. Delegate complex board logic to `Engine` services or Commands.
- **Performance:** The `Canvas` uses `requestAnimationFrame`. Avoid heavy computations in the render loop (`tick`).
- **Signals:** Prefer `Signal` for engine-internal communication over prop drilling or global event listeners.

## Key Directories
- `src/core/engine/`: Core controller logic.
- `src/core/services/`: Business logic modules.
- `src/core/shapes/`: Widget definitions.
- `src/core/command/`: Action implementations.
- `src/store/`: Zustand state slices.
- `src/components/ui/`: Reusable UI components.
