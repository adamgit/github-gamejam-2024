import { ActionHandler, ActionParameter, MissionContext } from '../types/mission';

/**
 * Required by typescript, otherwise it refuses to use Webpack's feature
 */
declare const require: {
    context(
      directory: string,
      useSubdirectories: boolean,
      regExp: RegExp
    ): {
      keys(): string[];
      <T>(id: string): T;
    };
  };

export class ActionRegistry {
  private static instance: ActionRegistry;
  private actions: Map<string, ActionHandler> = new Map();
  private initialized: boolean = false;

  private constructor() {}

  public static getInstance(): ActionRegistry {
    if (!ActionRegistry.instance) {
      ActionRegistry.instance = new ActionRegistry();
      ActionRegistry.instance.initialize();
    }
    return ActionRegistry.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    // Webpack magic to scan actions folder at build time
    const actionContext = require.context('./actions', false, /\.ts$/);

    const paths = actionContext.keys();
    paths.map(path => {
        // When using CommonJS module.exports, the actual module is in the 'default' property
        const imported = actionContext(path) as any;
        //console.log(`ACTION REGISTRY: key: ${path} gives value: ${imported}`)
        const actionType = path.replace(/^\.\//, '').replace(/\.ts$/, '');

        const action = imported.__esModule ? imported.default : imported;
        
        /*
        console.log(`ACTION REGISTRY: ... ${imported} gives .esmodule: ${imported.__esModule} ... action = ${action}`)

        console.log(`ACTION REGISTRY: path: ${path} --> actionType: ${actionType} ... imported: ${JSON.stringify(imported)}, action = ${JSON.stringify(action)}`);
        */

        this.actions.set( actionType, new action() as ActionHandler );
        
        /*const handler = this.actions.get(actionType);
        console.log(`AFTER setting, handler for ${actionType} = ${handler}`)*/

        //return action as ActionHandler;
      });

    this.initialized = true;
  }
  
  public async executeAction(
    type: string, 
    params: ActionParameter, 
    context: MissionContext
  ): Promise<void> {
    const handler = this.actions.get(type);
    if (!handler) {
      throw new Error(`Unknown action type: ${type}`);
    }
    
    /*console.log(`Executing ${type}:`, {
      paramType: typeof params,
      isArray: Array.isArray(params),
      value: params
    });*/
    
    await handler.execute(params, context);
  }

  public getAvailableActions(): string[] {
    return Array.from(this.actions.keys());
  }
}