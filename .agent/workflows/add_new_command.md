---
description: How to add a new command
---
# How to Add a New Command

This workflow explains the steps required to create a new command in the whiteboard application, register it, and make it available for use.

## 1. Create the Command Class

1. In `src/core/command/`, create a new file, e.g. `MyNewCommand.ts`.
2. Import the base `Command` class and any required types:
   ```typescript
   import { Command, Commands } from '@/core/command/Command';
   import { Engine } from '@/core/engine/Engine';
   ```
3. Extend `Command` and implement the required methods:
   ```typescript
   export class MyNewCommand extends Command {
       // Define any payload or parameters the command needs
       constructor(private payload: any) {
           super();
       }

       // The logic that runs when the command is executed
       execute(ctx: { engine: Engine; params: any }) {
           // TODO: implement command behaviour
           console.log('Executing MyNewCommand', this.payload);
           // Return true if the command succeeded
           return true;
       }

       // Optional: logic to undo the command
       undo(ctx: { engine: Engine; params: any }) {
           // TODO: revert the changes made in execute()
           console.log('Undoing MyNewCommand', this.payload);
           return true;
       }
   }
   ```
4. Export the command class at the bottom of the file.

## 2. Register the Command

1. Open `src/core/command/CommandRegistry.ts`.
2. Import your new command class:
   ```typescript
   import { MyNewCommand } from '@/core/command/MyNewCommand';
   ```
3. Inside the registration method, add a registration entry:
   ```typescript
   this.register(Commands.MY_NEW_COMMAND, (engine: Engine, payload: any) =>
       new MyNewCommand(payload),
   );
   ```
   - Ensure you add a new entry to the `Commands` enum in `Command.ts`:
     ```typescript
     export enum Commands {
         // ... existing commands
         MY_NEW_COMMAND = 'MY_NEW_COMMAND',
     }
     ```
4. Save the file. The command is now available via `engine.getCommand(Commands.MY_NEW_COMMAND)`.

## 3. (Optional) Add UI Integration

If the command should be triggered from the UI (e.g., a button in the sub‑toolbar):
1. Locate the appropriate reducer or action list (e.g., `src/components/board/subToolbar/SubtoolbarReducer.tsx`).
2. Add a new action entry similar to existing ones:
   ```typescript
   {
       id: 'myNewCommand',
       tooltip: 'My New Command',
       type: 'btnAction',
       btnActionProps: {
           command: Commands.MY_NEW_COMMAND,
           icon: <MyIcon />, // replace with an appropriate icon
       },
   }
   ```
3. Ensure the icon component is imported.

## 4. Test the Command

1. Run the application (`npm run dev`).
2. Trigger the command via the UI or programmatically:
   ```typescript
   const cmd = engine.getCommand(Commands.MY_NEW_COMMAND);
   cmd.execute({ engine, params: { /* payload */ } });
   ```
3. Verify that the command performs the expected action and that undo works correctly.

---
**Note**: Keep the command logic pure and side‑effect free where possible. Use the existing services (e.g., `WidgetsService`, `SelectionService`) to manipulate application state.
