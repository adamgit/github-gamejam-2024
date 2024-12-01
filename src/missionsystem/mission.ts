import { MissionTemplate, MissionEvent, MissionAction, MissionContext, EventStatus, TriggerConfig, TimeoutConfig, Action, MissionID, createMissionID } from '../types/mission';
import { ActionRegistry } from './actionRegistry';
import { MissionEventScheduler } from './MissionEventScheduler';
import { replaceTemplateVariables } from './template-variables';

export interface EventOutcome {
  status: Exclude<EventStatus, EventStatus.Pending>;
  timestamp: number;
  originalConfig: {
    trigger?: TriggerConfig;
    timeout?: TimeoutConfig;
    actions?: Action[];
  };
  // For completed triggers - what values triggered it
  triggerArgs?: any[];
}

export class Mission {
  private readonly id: MissionID;
  private readonly template: MissionTemplate;
  private readonly variables: Record<string, string>;

  /**
   * Lazily assigned because it needs the Mission object in its own constructor
   */
  private scheduler!: MissionEventScheduler;

  private isActive: boolean = true;
  private actionRegistry: ActionRegistry;

  constructor(
    id: string,
    template: MissionTemplate,
    variables: Record<string, string>
  ) {
    this.id = createMissionID(id);
    this.template = template;
    this.variables = variables;
    this.actionRegistry = ActionRegistry.getInstance();
  }

  public start()
  {
    this.scheduler = new MissionEventScheduler(this);
    this.startInitialEvents();
  }

  private startInitialEvents() {
    const initialEvents = this.template.eventsInitial;
    this.scheduler.scheduleEventsForMission( initialEvents );
  }

  getActiveEvents(): Array<{ name: string; status: EventStatus }> {
    return this.scheduler.getActiveEventIds().map(eventId => ({
      name: eventId,
      status: EventStatus.Pending
    }));
  }

  getEndedEvents(): Array<{ name: string; status: Exclude<EventStatus, EventStatus.Pending> }> {
    const history = this.scheduler.getEventHistory();
    return Array.from(history.entries())
      .map(([eventId, outcome]) => ({
        name: eventId,
        status: outcome.status
      }));
  }
 
  // Schedule an additional event after mission has started, e.g. as a side-effect of an earlier event running
  public scheduleEvent( eventName: string )
  {
    if (typeof eventName !== 'string') throw new Error(`eventName must be string, got: ${typeof eventName} with value: ${JSON.stringify(eventName)}`);

    // Find the event-config within this mission
    const eventSpec = this.template.events[eventName];

    //console.log(`SCEHEDUL EVENT from teplate; spec = ${JSON.stringify(eventSpec)}, template.events = ${JSON.stringify(this.template.events)}`)
    
    this.scheduler.scheduleSingleEvent( eventName, eventSpec );
  }

  // Cancel a specific event
 public cancelEvent(eventId: string) {
  this.scheduler.cancelEvent(eventId);
}
  
getEventStatuses(): Array<{
  name: string,
  status: EventStatus
}> {
  // Get history of completed/cancelled/timedout events
  const history = this.scheduler.getEventHistory();
  
  // Get currently pending events
  const activeEvents = this.getActiveEvents();

  // Combine with ended events
  const historicalEvents = this.getEndedEvents();

  return [...activeEvents, ...historicalEvents];
}

private createContext(): MissionContext {
  return {
    missionId: this.id,
    variables: this.variables,
    scheduleEvent: this.scheduleEvent.bind(this),
    cancelEvent: this.cancelEvent.bind(this),
    executeAdditionalActions: async (actions: MissionAction[]) => {
      this.executeActions(actions); // Reuse Mission's executeActions
    },
    template: this.template
  };
}

public async executeActions(actions: MissionAction[]): Promise<void> {
  const context = this.createContext();
  
  for (const action of actions) {
    if (!this.isActive) break;
    
    // Each action object should have exactly one key
    const [actionType] = Object.keys(action);
    const actionParam = action[actionType];
    
    console.log(`Executing action: ${actionType} with params:`, actionParam);
    await this.actionRegistry.executeAction(actionType, actionParam, context);
  }
}

  public getTemplate(): MissionTemplate {
    return this.template;
  }

  public getVariables(): Record<string,string> {
    return this.variables;
  }
  
}