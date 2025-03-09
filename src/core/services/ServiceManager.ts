import { Service } from "./Service"

export class ServiceManager {
    private services: Map<string, Service>

    constructor() {
        this.services = new Map()
    }

    /**
     * Register a service with the manager
     * @param name - Unique identifier for the service
     * @param service - Service instance to register
     */
    register<T extends Service>(name: string, service: T): void {
        if (this.services.has(name)) {
            throw new Error(`Service ${name} is already registered`)
        }
        this.services.set(name, service)
    }

    /**
     * Get a registered service by name
     * @param name - Name of the service to retrieve
     * @returns The requested service instance
     */
    get<T>(name: string): T {
        const service = this.services.get(name)
        if (!service) {
            throw new Error(`Service ${name} not found`)
        }
        return service as T
    }

    /**
     * Check if a service exists
     * @param name - Name of the service to check
     */
    has(name: string): boolean {
        return this.services.has(name)
    }

    /**
     * Remove a service from the manager
     * @param name - Name of the service to remove
     */
    remove(name: string): void {
        if (!this.services.has(name)) {
            throw new Error(`Service ${name} not found`)
        }
        this.services.delete(name)
    }

    /**
     * Clear all registered services
     */
    clear(): void {
        this.services.clear()
    }
}