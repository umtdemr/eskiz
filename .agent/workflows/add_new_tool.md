---
description: How to add a new tool (Service) using the Mouse Controller
---
# How to Add a New Tool

This workflow describes how to add a new interactive tool to the engine. Tools are implemented as **Services** that listen to mouse events via the `MouseController`.

## 1. Define Tool Constants

First, define the identifiers for your new tool.

### `src/helpers/Constant.ts`

Add your tool to `ACTION_MODES` (if it's a main tool like Select or Pan) or `SUB_ACTION_MODES` (if it's a sub-mode like drawing a specific shape). Also define a cursor owner.

```typescript
export const ACTION_MODES = {
    // ... existing
    MY_NEW_TOOL: 'MY_NEW_TOOL',
} as const

// ...

export const CURSOR_OWNERS = {
    // ... existing
    MY_NEW_TOOL: 'my-new-tool',
}
```

## 2. Create the Service Class

Create a new file in `src/core/services/MyNewToolService.ts`.

### Key Implementation Requirements

1.  **Extend `Service`**: Your class must extend the base `Service` class.
2.  **Dependencies**: Inject `MouseController` and `ToolService` in the constructor.
3.  **State Management**: Listen to `toolService.mainModeChanged` (or `subModeChanged`) to know when your tool is active.
4.  **Mouse Events**: Bind/unbind `MouseController` events (`mouseDown`, `mouseMove`, `mouseUp`) when your tool activates/deactivates.
5.  **Cursor**: Use `CursorService` to set the cursor when active.

### Example Template

```typescript
import { Service } from './Service'
import { Engine, CanvasMouseEvent } from '../engine/Engine'
import { MouseController } from '../engine/MouseController'
import { ToolService, MainModeChangedState } from './ToolService'
import { ACTION_MODES, CURSOR_OWNERS } from '@/helpers/Constant'
import { CursorService } from './CursorService'

export class MyNewToolService extends Service {
    private mouseController: MouseController
    private toolService: ToolService
    private cursorService: CursorService
    private isActive: boolean = false

    constructor(
        engine: Engine,
        mouseController: MouseController,
        toolService: ToolService
    ) {
        super(engine)
        this.mouseController = mouseController
        this.toolService = toolService
        this.cursorService = this.engine.getService<CursorService>('cursor')

        // Listen for mode changes
        this.toolService.mainModeChanged.add(this.onMainModeChanged, this)
    }

    private onMainModeChanged(state: MainModeChangedState) {
        if (state.tool === ACTION_MODES.MY_NEW_TOOL) {
            this.activate()
        } else {
            this.deactivate()
        }
    }

    private activate() {
        if (this.isActive) return
        this.isActive = true
        
        // Set cursor
        this.cursorService.setCursor(CURSOR_OWNERS.MY_NEW_TOOL, 'crosshair')

        // Bind events
        this.mouseController.on('mouseDown', this.onMouseDown, this)
        this.mouseController.on('mouseMove', this.onMouseMove, this)
        this.mouseController.on('mouseUp', this.onMouseUp, this)
    }

    private deactivate() {
        if (!this.isActive) return
        this.isActive = false
        
        // Unbind events
        this.mouseController.off('mouseDown', this.onMouseDown, this)
        this.mouseController.off('mouseMove', this.onMouseMove, this)
        this.mouseController.off('mouseUp', this.onMouseUp, this)
    }

    private onMouseDown(data: CanvasMouseEvent) {
        console.log('Mouse down at', data.pointer)
        // Implement logic
    }

    private onMouseMove(data: CanvasMouseEvent) {
        // Implement logic
    }

    private onMouseUp(data: CanvasMouseEvent) {
        // Implement logic
    }

    dispose(): void {
        this.deactivate()
        this.toolService.mainModeChanged.remove(this.onMainModeChanged, this)
    }
}
```

## 3. Register the Service

You must register your new service in the `Engine` to make it available and functional.

### `src/core/engine/Engine.ts`

1.  Import your new service.
2.  In `initializeServices()`, instantiate it and register it with `ServiceManager`.
    *   *Note: Pass dependencies from existing services or the engine.*

```typescript
// ... imports
import { MyNewToolService } from '../services/MyNewToolService'

// ... inside Engine class

    private initializeServices() {
        // ... existing services (order matters for dependencies)
        const toolService = new ToolService(this)
        
        // ...
        
        this.serviceManager.register(
            'myNewTool',
            new MyNewToolService(
                this,
                this._mouseController,
                toolService
            )
        )
    }
```

## 4. Triggering the Tool

To make the tool active, you typically add a button in the UI that calls `toolService.changeTool()`.

### Example Check
You can test it by manually calling:
```typescript
engine.getService<ToolService>('toolService').changeTool(ACTION_MODES.MY_NEW_TOOL)
```
