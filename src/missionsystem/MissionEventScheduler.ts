import { HostResolver } from '../data/HostResolver';
import { TriggerConfig, TimeoutConfig, EventStatus, MissionEvent } from '../types/mission';
import { EventOutcome, Mission } from './mission';
import { replaceTemplateVariables } from './template-variables';
import { getMissionOS } from './OSForMissions';
import { SubscribableEvent } from '../backgroundservices/subscribable-event';

/** To enable us to cancel events, timeout events, timeouts cancel triggers, triggers cancel timeouts, etc */
interface CleanupInfo {
  emitter: SubscribableEvent<any>;
  callback: (...args: any[]) => void;
}

export class MissionEventScheduler {
  // Add tracking of active events
  private activeEventIds: Set<string> = new Set<string>();
  private eventHistory: Map<string, EventOutcome> = new Map<string, EventOutcome>();
  // Per-instance tracking of cleanup handlers
  private cleanupCallbacks: Map<string,CleanupInfo> = new Map<string, CleanupInfo>();
  private timeoutHandles: Map<string, NodeJS.Timeout> = new Map<string, NodeJS.Timeout>();
  private mission: Mission;

  constructor(mission: Mission) {
    this.mission = mission;
  }


  // Batch scheduling method
  public scheduleEventsForMission(events: Record<string, MissionEvent>) {
    Object.entries(events).forEach(([eventId, config]) => {
      this.scheduleSingleEvent(eventId, config);
    });
  }

  public scheduleSingleEvent(eventId: string, config: MissionEvent)
  {

    // Guard against duplicate scheduling
    if (this.activeEventIds.has(eventId)) {
      throw new Error(`Event ${eventId} is already scheduled`);
    }
    else {
      //console.log(`...scheduling event ${eventId} in Mission: ${this.mission.getTemplate().missionId} ("${this.mission.getTemplate().title}")`);
    }
    this.activeEventIds.add(eventId);
    
    // Store original config for history
    const baseOutcome: Omit<EventOutcome, 'status' | 'timestamp'> = {
      originalConfig: { ...config }
    };

    // Simple actions execute immediately
    if (config.actions && !config.trigger && !config.timeout) {
      this.mission.executeActions(config.actions);
      this.completeEvent(eventId, baseOutcome, EventStatus.Instant);
      return;
    }

    // Use single implementation for all other cases
    this.setupTriggerWithTimeout(eventId, config.trigger, config.timeout, baseOutcome);
  }

  getActiveEventIds(): string[] {
    return Array.from(this.activeEventIds);
  }

  getEventHistory(): Map<string, EventOutcome> {
    return this.eventHistory;
  }

  public cancelEvent(eventId: string) {
    
    if (!this.activeEventIds.has(eventId)) {
        console.error(`Attempted to cancel non-active event: ${eventId} ... active event ids is now: ${Array.from(this.activeEventIds)}`);
        return;
    }

    const cleanupInfo = this.cleanupCallbacks.get(eventId);
    if (!cleanupInfo) {
        console.error(`[DEBUG] No cleanup info found for event: ${eventId}`);
        return;
    }

    this.cleanupHandlers(eventId);
    this.activeEventIds.delete(eventId);
}

  private completeEvent(
    eventId: string,
    baseOutcome: Omit<EventOutcome, 'status' | 'timestamp'>,
    status: EventStatus.Instant | EventStatus.Triggered | EventStatus.Cancelled | EventStatus.Timedout,
    triggerArgs?: any[]
  ): void {
    this.eventHistory.set(eventId, {
      ...baseOutcome,
      status,
      timestamp: Date.now(),
      ...(triggerArgs && { triggerArgs })
    });
    this.activeEventIds.delete(eventId);
  }

  private setupTriggerWithTimeout(
    eventId: string,
    triggerConfig?: TriggerConfig,
    timeoutConfig?: TimeoutConfig,
    baseOutcome?: Omit<EventOutcome, 'status' | 'timestamp'>
  ) {
    // Early return for no-op case
    if (!triggerConfig && !timeoutConfig) {
      this.activeEventIds.delete(eventId);
      return;
    }

    if (triggerConfig) {
      this.setupTrigger(eventId, triggerConfig, baseOutcome);
    }

    if (timeoutConfig) {
      this.setupTimeout(eventId, timeoutConfig);
    }
  }

  private setupTrigger(
    eventId: string,
    triggerConfig: TriggerConfig,
    baseOutcome?: Omit<EventOutcome, 'status' | 'timestamp'>
): void {
    
    console.log(`Setting up trigger for event-name: ${eventId}`);
    //console.log(`trigger: ${triggerConfig}, JSON trigger: ${JSON.stringify(triggerConfig)} ... triggerConfig.subscribe.registryName: ${triggerConfig.subscribe.registryName}`);
    //console.log("DEBUG: attempting to setup trigger: "+JSON.stringify(triggerConfig.subscribe)+" ... onTrigger = "+JSON.stringify(triggerConfig.onTrigger));

    const registryName = triggerConfig.subscribe.registryName;
    const { target, method, conditionArgs, condition } = triggerConfig.subscribe;

    /**
     * Two different code-paths, one for services-on-virtualservers (has EXPLICIT hostname), the other for services-on-the-local-desktop (no named host)
     */

    let service;

    if (registryName) {
      const registry = HostResolver.getInstance().resolve(registryName);
      service = registry.serviceByName(target);

      if (!service) {
        throw new Error(`Service not found: ${target} (looked in registry: ${registryName ? registryName : 'default'}) ...found services: [${registry.debugListAllServices()}]`);
      }
    }
    else {
      if (target.toLowerCase() === 'service.chat')
        service = getMissionOS().chatService;
      else if (target.toLowerCase() === 'service.wallet')
        service = getMissionOS().walletService;
      else
        console.error(`Could not find a recognized 'service' in the target field (${target}) that we could match to a known hardcoded service on the global/Desktop's OperatingSystem instance`);
    }


    if (!service) {
      throw new Error(`Service not found: ${target} (registryName provided, or not-provided, was: '${registryName}')`);
    }

    //console.log(`Setting up trigger for event ${eventId} on triggerConfig: ${JSON.stringify(triggerConfig)}`);

    // Convert the string into a function
    const conditionWithVarsFilledIn = replaceTemplateVariables(condition, this.mission.getVariables());
    var conditionFunction;
    try {
      conditionFunction = new Function(...conditionArgs.split(','), conditionWithVarsFilledIn);// as (...args: any[]) => boolean;
    }
    catch (e) {
      console.error(`Error; trying to evaluate conditionFunction: \n\n${conditionWithVarsFilledIn}\n\n --- error: ${e}`);
    }


    const eventEmitter = service[method];
    if (!eventEmitter) {
      console.error(`Couldn't find method ${method} on service ${service} / name:${target} - (from registry: ${registryName ?? '[localhost]'}) - won't be able to subscribe this event to trigger off that method!`);
    }
    
    const callback = (...args: any[]) =>
    {
      console.log(`... for event ${eventId} on triggerConfig: ${JSON.stringify(triggerConfig)}`);

      const expectedArgCount = conditionArgs.split(',').length;
      const limitedArgs = args.slice(0, expectedArgCount);

      console.log('Using args:', limitedArgs);
      console.log('Using condition-source:' + conditionWithVarsFilledIn);
      const result = conditionFunction(...limitedArgs);
      console.log('Result:', result);

      if (result) {
        console.log(`CONDITION function returned TRUE (source-code: ${conditionWithVarsFilledIn}) ... args were: ${JSON.stringify(args)}`);
        this.cleanupHandlers(eventId);
        this.mission.executeActions(triggerConfig.onTrigger.actions);

        if (baseOutcome) {
          this.completeEvent(eventId, baseOutcome, EventStatus.Triggered, args);
        }
      }
    };

    
    eventEmitter.addListener(callback);
    
    // Store BOTH the event emitter and the callback function
    // This ensures we keep the exact same function reference for removal
    this.cleanupCallbacks.set(eventId, {
      emitter: eventEmitter,
      callback: callback
    });
    
  }

  private setupTimeout(
    eventId: string,
    timeoutConfig: TimeoutConfig,
    baseOutcome?: Omit<EventOutcome, 'status' | 'timestamp'>
  ): void {
    const timeoutHandle = setTimeout(() => {
      this.cleanupHandlers(eventId);
      this.mission.executeActions(timeoutConfig.onTimeout.actions);

      if (baseOutcome) {
        this.completeEvent(eventId, baseOutcome, EventStatus.Timedout);
      }
    }, timeoutConfig.delay);

    this.timeoutHandles.set(eventId, timeoutHandle);
  }

  private cleanupHandlers(eventId: string): void {
    const timeoutHandle = this.timeoutHandles.get(eventId);
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
      this.timeoutHandles.delete(eventId);
    }

    const cleanupInfo = this.cleanupCallbacks.get(eventId);
    if (cleanupInfo) {
      console.log(`Removing listener for event: ${eventId}`);
      cleanupInfo.emitter.removeListener(cleanupInfo.callback);
      this.cleanupCallbacks.delete(eventId);
    }
  }
}