// Generic Custom Event class with listener removal
export class SubscribableEvent<TArgs extends any[]> {
    private listeners: Array<(...args: TArgs) => void> = [];
    private debugName: string;

    constructor( dName?: string )
    {
        this.debugName = dName;
    }

    // Method to add a listener with type safety
    addListener(callback: (...args: TArgs) => void): void {
        //console.log("[Subscribable:"+this.debugName+"] Adding listener to "+this.listeners.length+" listeners...")
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        } else {
            throw new Error('Listener must be a function');
        }
    }

    // Method to remove a listener
    removeListener(callback: (...args: TArgs) => void): void {
        this.listeners = this.listeners.filter(listener => listener !== callback);

        //console.log("[Subscribable:"+this.debugName+"] Removed listener, now have "+this.listeners.length+" listeners...")
    }

    // Method to invoke all listeners with the given arguments
    invoke(...args: TArgs): void {
        //console.log("[Subscribable:"+this.debugName+"] Sending event to "+this.listeners.length+" listeners...")
        this.listeners.forEach(listener => listener(...args));
    }
}