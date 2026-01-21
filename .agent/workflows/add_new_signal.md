---
description: How to add a new Signal
---
# How to Add a New Signal

Signals are lightweight event emitters used throughout the codebase (e.g., `boundsChanged`, `clicked`). This workflow explains how to create, expose, and use a new signal.

## 1. Define the Signal Property
1. Open the class where the signal should live (e.g., a widget, service, or component).
2. Import the `Signal` class:
   ```typescript
   import { Signal } from '@/core/signal/Signal';
   ```
3. Add a public property for the signal, optionally with a generic payload type:
   ```typescript
   // Example payload type
   export type MyEventPayload = { value: number };

   // Inside the class
   public myEvent = new Signal<MyEventPayload>({ memorize: false });
   ```
   - `memorize: true` will keep the last emitted value for late listeners.
   - Choose `false` for transient events.

## 2. Emit the Signal
When the relevant state changes, call `dispatch` with the payload:
```typescript
this.myEvent.dispatch({ value: this._someValue });
```
If the signal has no payload, simply call `dispatch()`.

## 3. Subscribe to the Signal
Other parts of the app can listen to the signal:
```typescript
// Somewhere else, with a reference to the instance
instance.myEvent.add(this.handleMyEvent, this);

private handleMyEvent(payload: MyEventPayload) {
    console.log('Received', payload.value);
    // react to the change
}
```
- Use `remove` to unsubscribe, or `removeAll` to clear all listeners.

## 4. Clean Up (Optional)
If the owning object is destroyed, clean up listeners to avoid memory leaks:
```typescript
this.myEvent.removeAll();
```
Or, if you only need to remove a specific listener:
```typescript
this.myEvent.remove(this.handleMyEvent, this);
```

## 5. Testing the Signal
1. Write a unit test that creates an instance, subscribes, triggers `dispatch`, and asserts the listener was called with the correct payload.
2. Ensure `remove` works by unsubscribing and confirming the listener is no longer invoked.

---
**Tip**: Keep signals focused on a single responsibility. For complex interactions, consider a higher‑level service that aggregates multiple signals.
