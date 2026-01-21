---
description: How to add a new widget that is saved to the database
---
# How to Add a New Widget

This workflow describes the steps to add a new widget to the whiteboard application, ensuring it can be saved to the database, rendered, and interacted with.

## 1. Define Widget Types

First, define the type identifiers for your new widget.

### `src/core/constants.ts`
Add a new constant to `WidgetType` (and potentially `ShapeType`, `LineType`, etc. if it fits those categories, or create a new one).

```typescript
export const WidgetType = {
    // ... existing types
    NEW_WIDGET: 'newWidget',
} as const
```

### `src/core/shapes/Widget.ts`
Update the `DbWidgetType` and `SubType` types to include your new widget. This ensures strict typing for database serialization.

```typescript
export type DbWidgetType =
    | typeof WidgetTypeConst.SHAPE
    // ...
    | typeof WidgetTypeConst.NEW_WIDGET

export type SubType =
    | (typeof ShapeTypeConst)[keyof typeof ShapeTypeConst]
    // ...
    | 'newSubType' // Define a subtype string if needed, or reuse an existing one like LineType.LINE
    
// Ensure WidgetFullType encompasses <Type>_<SubType>
```

## 2. Create the Component Class

Create a new file for your widget (e.g., `src/core/shapes/newWidget/NewWidget.ts`). Your class should extend `Widget` (or `Shape` if it shares shape characteristics).

### Key Implementation Requirements

1.  **Props Interface**: Define a `Props` interface extending `WidgetProps` that includes a `properties` object for your specific widget data.
2.  **Constructor**:
    *   Call `super(WidgetType.NEW_WIDGET, props)`.
    *   Initialize private fields from `props.properties`.
    *   Set `this._interactive = true` if it should be selectable/interactive.
3.  **`renderContent`**: Implement this method to draw your widget using CanvasKit (Skia).
4.  **`toJson`**: Implement serialization for saving to DB/WebSocket.
5.  **`static loadFromJson`**: Implement deserialization.
6.  **`updateWithPartialState`**: Handle updates from the server/collaborators.
7.  **Capabilities**: Implement methods to control toolbar options (e.g., `canChangeBackgroundColor`, `canSnap`).

### Example Structure

```typescript
import { Widget, WidgetJson, WidgetProps } from '../Widget'
import { WidgetType } from '@/core/constants'
// ... imports

export interface NewWidgetProps extends WidgetProps {
    properties: NewWidgetProperties
}

export interface NewWidgetProperties {
    // Define specific properties to save
    someValue: number
    color: string
}

export class NewWidget extends Widget {
    // Private fields to hold state
    private _someValue: number

    constructor(props: NewWidgetProps) {
        super(WidgetType.NEW_WIDGET, props)
        this._interactive = true
        this._someValue = props.properties.someValue
        // ... init others
    }
    
    // 1. Rendering
    renderContent(renderContext: RenderContext) {
        const ctx = renderContext.ctx
        // Use CanvasKit to draw
        // ctx.drawPath(...)
    }

    // 2. Serialization
    toJson(): WidgetJson {
        return {
            x: this._x,
            y: this._y,
            width: this._width,
            height: this._height,
            z_index: this._zIndex,
            uuid: this._uuid!,
            widget_type: WidgetType.NEW_WIDGET,
            sub_type: 'newSubType',
            properties: {
                someValue: this._someValue,
                // ... save other props
            },
            is_deleted: this._isDeleted,
            is_locked: this._isLocked,
             // ... parent_widget_id if needed
        }
    }

    // 3. Deserialization
    static loadFromJson(json: WsWidget): NewWidget {
        const properties = json.properties as unknown as NewWidgetProperties
        return new NewWidget({
            x: json.x,
            y: json.y,
            width: json.width,
            height: json.height,
            uuid: json.uuid,
            z_index: json.z_index,
            is_locked: json.is_locked,
            properties: {
                someValue: properties.someValue,
                // ... load other props
            },
        })
    }
    
    // 4. Updates
    updateWithPartialState(json: Partial<WsWidget>) {
        super.updateWithPartialState(json) // Handles basic props like x, y, width, height
        if (json.properties) {
             const properties = json.properties as Partial<NewWidgetProperties>
             if (properties.someValue !== undefined) {
                 this._someValue = properties.someValue
                 // Trigger repaint if needed:
                 // this._paint = null 
             }
        }
    }
}
```

## 3. Register the Widget

Register your new widget in the factory so it can be instantiated from JSON.

### `src/core/engine/WidgetFactory.ts`

```typescript
// Import your class
import { NewWidget } from '@/core/shapes/newWidget/NewWidget'

// On app initialization or just import side-effect if possible, but typically explicit:
WidgetFactory.registerWidget(WidgetType.NEW_WIDGET, 'newSubType', NewWidget)
```

## 4. UI Integration (Subtoolbar)

To show options in the subtoolbar when your widget is selected:

### Capabilities methods in Widget Class
Implement these methods in your `NewWidget` class to control what options appear:
```typescript
canChangeBgColor(): boolean { return true }
canChangeBorderColor(): boolean { return true }
canChangeThickness(): boolean { return true }
// ... others
```

### Action Generation
Update `src/components/board/subToolbar/SubtoolbarReducer.tsx` to generate actions for your widget type.

1.  Create a helper function `getNewWidgetActions()` (similar to `getShapeActions`).
2.  Update `generateActions` switch statement:

```typescript
switch (widget.widgetType) {
    // ...
    case WidgetType.NEW_WIDGET:
        actions.push(...getNewWidgetActions())
        break
}
```

## 5. Interactions (Snapping)

If lines can attach to your widget, implement snapping interface in your class:

```typescript
    canSnap(): boolean {
        return true
    }

    getSnapPoints(): { x: number; y: number }[] {
        const bounds = this.bounds
        // Return absolute coordinates of snap points
        return [
            { x: bounds.x + bounds.width / 2, y: bounds.y },
            // ...
        ]
    }
```
