export type TemplateID = string & { readonly __brand: unique symbol };
export type MissionID = string & { readonly __brand: unique symbol };
// Helper functions to safely create IDs
export function createTemplateID(id: string): TemplateID {
  return id as TemplateID;
}
export function createMissionID(id: string): MissionID {
  return id as MissionID;
}

export interface MissionReward
{
  bytecoins?: number,
  reputation?: number,
  install?: string | string[],
}

export interface MissionTemplate {
    templateID: TemplateID;
    title: string;
    
    blockedUntil?: string[]; // won't schedule UNTIL these exist
    blockedBy?: string[]; // won't schedule WHILE these exist
    requiresMinReputation?: number;
    
    successUnblocks?: string[]; // creates these AFTER mission is successfully completed
    successBlocks?: string[]; // creates these AFTER mission is successfully completed
    maxConcurrentInstances?: number;
    maxSuccessCompletions?: number,
    minSecondsBeforeRetryAfterFailure?: number,
    
    reward?: MissionReward,

    createMission: () => Record<string, string>;
    eventsInitial: Record<string, MissionEvent>;
    events: Record<string, MissionEvent>;
  }

  export interface EventAction
  {

  }

  export interface MissionEvent
  {
    actions?:Action[];
    timeout?:TimeoutConfig;
    trigger?:TriggerConfig;
  }
  
  export interface TriggerConfig {
    subscribe: {
      registryName?: string;
      target: string;
      method: string;
      conditionArgs?: string;
      condition: string;//Claude screwed this up: (...args: any[]) => boolean;
    };
    onTrigger: {
      actions: Action[];
    };
  }

  export interface TimeoutConfig {
    delay: number;
    onTimeout: {
      actions: Action[];
    };
  }

  export enum EventStatus {
    Instant, // ran synchronously, completed immediately
    Pending, // may have run synchronously, but is also now waiting on a 'trigger' or 'timeout'
    Triggered, // trigger happened, completing the event
    Timedout, // timeout happened, completing the event
    Cancelled // something external cancelled the event
  }  

  
  /** Unfortunately, we need 'nested' parameters for control-flow actions, e.g. 'conditional.ts' (implements if/then logic) */
  export type NestedActionParameter = {
    type: string;             // The type of the nested action (e.g., "send", "schedule")
    params: ActionParameter;  // Parameters for the nested action
  };
  // The actual parameters an action can receive
  // If you don't need if/then or for-loops: export type ActionParameter = string | number | (string | NestedActionParameter)[];
  export type ActionParameter = string
  | number
  | (string | NestedActionParameter)[]
  | [ConditionDefinition, MissionAction[], MissionAction[]];


  /** Messy way to get if/then and for/while loops into the mission-template files */
  export type ConditionDefinition =
  | string
  | {
      resolve: {
        hostname: string;
        target: string;
        method: string;
        args: (string | number)[];
      };
    }
  ;

// A single mission action is a map with exactly one key (the action type)
// and its value is the parameter(s) for that action
export type MissionAction = {
  [type: string]: ActionParameter;
}

// The handler interface matches the parameter types exactly
export interface ActionHandler {
  execute(params: ActionParameter, context: MissionContext): Promise<void>;
}
  
  export interface MissionContext {
    missionId: MissionID;
    variables: Record<string, string>;
    scheduleEvent: (eventName:string) => void;
    cancelEvent: (eventName: string) => void;
    /** Necessary for advanced actions that have to DIRECTLY schedule additional sub-lists of actions, calculated at runtime/dynamically */
    executeAdditionalActions: (actions: MissionAction[]) => Promise<void>;
    template: MissionTemplate;
  }
  
  export type Action = {
    [key: string]: any | ActionHandler;  // The value can be either params for the handler or the handler itself
  };

  export interface ActionHandler {
    execute: (params: ActionParameter, context: MissionContext) => Promise<void>;
  }
