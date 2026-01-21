---
description: How to add a new service
---
# How to Add a New Service

This workflow outlines the steps to create and register a new service in the whiteboard application.

## 1. Create the Service Class
1. In `src/core/services/`, create a new file, e.g. `MyNewService.ts`.
2. Import the base `Service` class:
   ```typescript
   import { Service } from '@/core/services/Service';
   import { Engine } from '@/core/engine/Engine';
   ```
3. Extend `Service` and implement any needed methods:
   ```typescript
   export class MyNewService extends Service {
       constructor(engine: Engine) {
           super(engine);
           // initialization code here
       }

       // Example method
       doSomething() {
           // service logic
       }
   }
   ```

## 2. Register the Service
1. Open `src/core/engine/Engine.ts` (method `initializeServices`).
2. Import your service:
   ```typescript
   import { MyNewService } from '@/core/services/MyNewService';
   ```
3. Register it with the `ServiceManager`:
   ```typescript
   this.serviceManager.register('myNewService', new MyNewService(this));
   ```
   Use a descriptive name as the first argument.

## 3. Access the Service
Anywhere you have an `Engine` instance, retrieve the service via:
```typescript
const myService = engine.getService<MyNewService>('myNewService');
myService.doSomething();
```

## 4. (Optional) Add to Dependency Injection
If the service depends on other services, inject them via the constructor and retrieve them from the engine inside the constructor.

## 5. Test the Service
1. Write unit tests in `src/core/services/__tests__/MyNewService.test.ts`.
2. Ensure the service registers correctly and its methods behave as expected.

---
*Keep the service focused on a single responsibility and avoid direct UI manipulation; use existing services (e.g., `WidgetsService`, `SelectionService`) for that purpose.*
