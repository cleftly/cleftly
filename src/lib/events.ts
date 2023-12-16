/* eslint-disable @typescript-eslint/no-explicit-any */
import { writable } from 'svelte/store';

export type EventCallback<T extends any[]> = (...args: T) => Promise<void>;

class EventManager {
    private events: Record<string, Set<EventCallback<any>>> = {};
    private eventStore = writable(this.events);

    onEvent<T extends any[]>(
        eventName: string,
        callback: EventCallback<T>
    ): () => void {
        if (!this.events[eventName]) {
            this.events[eventName] = new Set();
        }

        this.events[eventName].add(callback);
        this.eventStore.set(this.events);

        return () => {
            this.events[eventName].delete(callback);
            if (this.events[eventName].size === 0) {
                delete this.events[eventName];
            }
            this.eventStore.set(this.events);
        };
    }

    async fireEvent<T extends any[]>(
        eventName: string,
        ...args: T
    ): Promise<void> {
        const eventCallbacks = this.events[eventName];

        if (eventCallbacks) {
            const promises = Array.from(eventCallbacks).map(
                async (callback) => {
                    try {
                        await callback(...args);
                    } catch (error) {
                        console.error(
                            `Error firing event "${eventName}"`,
                            error
                        );
                    }
                }
            );

            await Promise.all(promises);
        }
    }

    getEventStore() {
        return this.eventStore;
    }
}

export const eventManager = new EventManager();
