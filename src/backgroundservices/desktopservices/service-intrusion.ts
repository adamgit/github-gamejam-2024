import { SubscribableEvent } from '../subscribable-event';
import { GameServices } from '../../gameServices';

interface IntrusionConfig {
    baseFrequencySeconds: number;  // Average time between intrusions
    frequencyVariance: number;     // Random variance in frequency (±)
    easyProbability: number;       // Chance of generating an "easy" intrusion (0-1)
    initialSeverityEasy: number;   // Starting severity for easier intrusions
    initialSeverityHard: number;   // Starting severity for harder intrusions
    rampUpTimeSecondsEasy: number; // Time to reach peak severity (easy)
    rampUpTimeSecondsHard: number; // Time to reach peak severity (hard)
    peakDurationMin: number;       // Minimum time at peak severity
    peakDurationMax: number;       // Maximum time at peak severity
    rampDownTimeMin: number;       // Minimum time to ramp down
    rampDownTimeMax: number;       // Maximum time to ramp down
}

export class IntrusionService {
    private static readonly DEFAULT_CONFIG: IntrusionConfig = {
        baseFrequencySeconds: 60,
        frequencyVariance: 15,
        easyProbability: 0.7,
        initialSeverityEasy: 20,
        initialSeverityHard: 80,
        rampUpTimeSecondsEasy: 10,
        rampUpTimeSecondsHard: 5,
        peakDurationMin: 2,
        peakDurationMax: 8,
        rampDownTimeMin: 5,
        rampDownTimeMax: 12
    };

    public readonly onIntrusionAttempt: SubscribableEvent<[{ severity: number, type: string }]>;
    public readonly onIntrusionSucceeded: SubscribableEvent<[]>;

    private currentSeverity: number = 0;
    private isNetworkSuspended: boolean = false;
    private activeEventTimeout?: number;
    private severityCheckInterval?: number;
    private config: IntrusionConfig;

    constructor(config: Partial<IntrusionConfig> = {}) {
        this.config = { ...IntrusionService.DEFAULT_CONFIG, ...config };
        this.onIntrusionAttempt = new SubscribableEvent("onIntrusionAttempt");
        this.onIntrusionSucceeded = new SubscribableEvent("onIntrusionSucceeded");
        this.startService();
    }

    private startService(): void {
        this.scheduleNextEvent();
    }

    private scheduleNextEvent(): void {
        if (this.activeEventTimeout) {
            clearTimeout(this.activeEventTimeout);
        }
    
        const checkAndSchedule = () => {
            if (GameServices.missions?.getActiveMissions().length > 0) {
                // If there are active missions, check again later
                this.activeEventTimeout = window.setTimeout(checkAndSchedule, 1000);
                return;
            }
    
            const delay = (this.config.baseFrequencySeconds +
                (Math.random() * 2 - 1) * this.config.frequencyVariance) * 1000;
    
            this.activeEventTimeout = window.setTimeout(() => {
                this.startIntrusionEvent();
                checkAndSchedule();
            }, delay);
        };
    
        checkAndSchedule();
    }

    private startIntrusionEvent(): void {
        if (this.severityCheckInterval) {
            return; // Event already running
        }

        console.log("-----------starting an intrusion attempt-------------")
        const isEasy = Math.random() < this.config.easyProbability;
        const initialSeverity = isEasy ?
            this.config.initialSeverityEasy :
            this.config.initialSeverityHard;
        const rampUpTime = isEasy ?
            this.config.rampUpTimeSecondsEasy :
            this.config.rampUpTimeSecondsHard;

        const peakDuration = this.config.peakDurationMin +
            Math.random() * (this.config.peakDurationMax - this.config.peakDurationMin);
        const rampDownTime = this.config.rampDownTimeMin +
            Math.random() * (this.config.rampDownTimeMax - this.config.rampDownTimeMin);

        let phase: 'rampUp' | 'peak' | 'rampDown' = 'rampUp';
        let startTime = Date.now();
        let peakStartTime = 0;
        let rampDownStartTime = 0;

        this.currentSeverity = initialSeverity;
        this.severityCheckInterval = window.setInterval(() => {
            const now = Date.now();

            if (phase === 'rampUp') {
                const progress = (now - startTime) / (rampUpTime * 1000);
                if (progress >= 1) {
                    phase = 'peak';
                    peakStartTime = now;
                    this.currentSeverity = 100;
                } else {
                    this.currentSeverity = initialSeverity + (100 - initialSeverity) * progress;
                }
            } else if (phase === 'peak') {
                if (now - peakStartTime >= peakDuration * 1000) {
                    phase = 'rampDown';
                    rampDownStartTime = now;
                }
            } else if (phase === 'rampDown') {
                const progress = (now - rampDownStartTime) / (rampDownTime * 1000);
                if (progress >= 1) {
                    this.endIntrusionEvent();
                    return;
                }
                this.currentSeverity = 100 * (1 - progress);
            }

            this.onIntrusionAttempt.invoke({
                severity: this.currentSeverity,
                type: isEasy ? 'gradual' : 'aggressive'
            });

            if (!this.isNetworkSuspended) {
                const intrusionChance = Math.max(0, (this.currentSeverity - 70) * 2);
                if (Math.random() * 100 < intrusionChance) {
                    this.Intruded();
                }
            }
        }, 1000);
    }

    private endIntrusionEvent(): void {
        if (this.severityCheckInterval) {
            clearInterval(this.severityCheckInterval);
            this.severityCheckInterval = undefined;
        }
        this.currentSeverity = 0;
    }

    private Intruded(): void {
        console.log(`00000000000000000000000 INTRUSION SUCCEEDED 000000000000000000000`)
        this.onIntrusionSucceeded.invoke();
        this.endIntrusionEvent();
    }

    public suspendNetworkInterface(): void {
        this.isNetworkSuspended = true;
    }

    public restoreNetworkInterface(): void {
        this.isNetworkSuspended = false;
    }
}