---
description: How to add a new Subtoolbar action
---
# How to Add a New Subtoolbar Action

This workflow explains the steps to add a new button or input to the subtoolbar, making it appear when a widget is selected.

## 1. Define the UI Component (if needed)
1. Create a React component in `src/components/board/subToolbar/actions/` (e.g., `MyActionButton.tsx`).
2. Export it as a default component that receives `engine` and any needed props.
   ```tsx
   import { Button } from '@/components/ui/button';
   import { Commands } from '@/core/command/Command';

   export const MyActionButton = ({ engine }: { engine: Engine }) => {
       const handleClick = () => {
           const cmd = engine.getCommand(Commands.MY_NEW_COMMAND);
           cmd.execute({ engine, params: {} });
       };
       return <Button onClick={handleClick}>My Action</Button>;
   };
   ```

## 2. Add an Action Entry in `SubtoolbarReducer`
1. Open `src/components/board/subToolbar/SubtoolbarReducer.tsx`.
2. Import the command enum and any icons you need:
   ```typescript
   import { Commands } from '@/core/command/Command';
   import { MyIcon } from '@/components/icons/MyIcon';
   ```
3. Create a helper function similar to the existing ones:
   ```typescript
   function getMyWidgetActions(): Action[] {
       return [
           {
               id: 'myAction',
               tooltip: 'My Action',
               type: 'btnAction',
               btnActionProps: {
                   command: Commands.MY_NEW_COMMAND,
                   icon: <MyIcon />, // replace with your icon component
               },
           },
       ];
   }
   ```
4. Add a case for your widget type (or a generic case) in `generateActions`:
   ```typescript
   case WidgetType.MY_WIDGET:
       actions.push(...getMyWidgetActions());
       break;
   ```
   If the action should be available for multiple widget types, add it to each relevant case or to the common section.

## 3. Register the Command (if not already done)
Ensure the command referenced (`Commands.MY_NEW_COMMAND`) exists and is registered in `CommandRegistry`.

## 4. Update the UI Import
If you created a custom component (e.g., `MyActionButton`), import it at the top of `Subtoolbar.tsx` and add a rendering branch:
```tsx
import { MyActionButton } from './actions/MyActionButton';
// ... inside the render loop
else if (action.type === 'myCustom') {
    return <MyActionButton key={action.id} engine={engine} />;
}
```

## 5. Test the New Action
1. Run the app (`npm run dev`).
2. Select a widget of the appropriate type.
3. Verify the new button appears in the subtoolbar and triggers the command.
4. Check undo/redo if the command modifies state.

---
**Tip**: Keep the action’s `type` consistent with existing ones (`btnAction`, `lineColorInput`, etc.) so the reducer’s render logic can handle it without extra changes.
