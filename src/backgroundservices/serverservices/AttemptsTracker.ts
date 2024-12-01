interface AttemptRecord {
    timestamps: number[];
}

export class AttemptsTracker<T> {
    private attempts: Map<string, AttemptRecord>;
    private readonly maxAttempts: number;
    private readonly windowSeconds: number;
    private readonly lockoutCallback: (item: T) => void;
    private readonly keyGenerator: (item: T) => string;
    private cleanupInterval: number;  // Changed to number for browser environments

    constructor(
        options: {
            maxAttempts: number,
            windowSeconds: number,
            lockoutCallback: (item: T) => void,
            keyGenerator?: (item: T) => string,
            cleanupIntervalSeconds?: number
        }
    ) {
        this.attempts = new Map();
        this.maxAttempts = options.maxAttempts;
        this.windowSeconds = options.windowSeconds;
        this.lockoutCallback = options.lockoutCallback;
        
        // Default key generator uses JSON.stringify
        // Can be overridden if T contains non-serializable content or custom key generation is needed
        this.keyGenerator = options.keyGenerator || ((item: T) => JSON.stringify(item));

        // Start periodic cleanup
        const cleanupInterval = options.cleanupIntervalSeconds || 60;  // Default to 60 seconds
        this.cleanupInterval = window.setInterval(
            () => this.cleanup(),
            cleanupInterval * 1000
        );
    }

    public recordAttempt(item: T): void {
        const key = this.keyGenerator(item);
        const now = Date.now();
        const record = this.attempts.get(key) || { timestamps: [] };
        
        // Add new timestamp
        record.timestamps.push(now);
        
        // Update map if this is the first failure
        if (!this.attempts.has(key)) {
            this.attempts.set(key, record);
        }

        // Check if item should be locked out
        if (this.shouldLockout(key)) {
            console.log("Locking out!");
            this.lockoutCallback(item);
        }
    }

    private shouldLockout(key: string): boolean {
        const record = this.attempts.get(key);
        if (!record) return false;

        const now = Date.now();
        const windowStart = now - (this.windowSeconds * 1000);

        // Count attempts within the time window
        const recentAttempts = record.timestamps.filter(
            timestamp => timestamp > windowStart
        ).length;

        console.log("lockout check: for key: -- "+key+" -- attempts = "+recentAttempts +" (max = "+this.maxAttempts+")");

        return recentAttempts >= this.maxAttempts;
    }

    private cleanup(): void {
        const now = Date.now();
        const windowStart = now - (this.windowSeconds * 1000);

        for (const [key, record] of this.attempts) {
            // Remove old timestamps
            record.timestamps = record.timestamps.filter(
                timestamp => timestamp > windowStart
            );

            // If no recent attempts, remove the key entirely
            if (record.timestamps.length === 0) {
                this.attempts.delete(key);
            }
        }
    }

    public destroy(): void {
        window.clearInterval(this.cleanupInterval);
    }

    // For testing/monitoring purposes
    public getAttemptCount(item: T): number {
        const key = this.keyGenerator(item);
        const record = this.attempts.get(key);
        if (!record) return 0;

        const now = Date.now();
        const windowStart = now - (this.windowSeconds * 1000);
        return record.timestamps.filter(timestamp => timestamp > windowStart).length;
    }
}