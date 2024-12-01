import { HostResolver } from '../../data/HostResolver';
import { ActionHandler, ActionParameter, ConditionDefinition, MissionAction, MissionContext } from '../../types/mission';
import { replaceTemplateVariables } from '../template-variables';

export default class ConditionalAction implements ActionHandler {

    async execute(params: ActionParameter, context: MissionContext): Promise<void> {
        if (!Array.isArray(params) || params.length !== 3) {
          throw new Error(
            `Invalid parameters for conditional action. Expected [condition: string | resolve, thenActions: MissionAction[], elseActions: MissionAction[]], got: ${JSON.stringify(params)}`
          );
        }
    
        const [condition, thenActions, elseActions] = params as [
          ConditionDefinition,
          MissionAction[],
          MissionAction[]
        ];
    
        let conditionResult: boolean;
    
        if (typeof condition === "string") {
          // Simple string condition
          const resolvedCondition = replaceTemplateVariables(condition, context.variables);
          console.log(`[conditional.ts] - will attempt with string-condition: ${condition}`);
          conditionResult = new Function('context', `return ${resolvedCondition}`)(context);
        } else if ("resolve" in condition) {
          // Method-based condition
          const { hostname, target, method, args } = condition.resolve;
          const resolvedHostname = replaceTemplateVariables(hostname, context.variables);
          const resolvedTarget = replaceTemplateVariables(target, context.variables);
          const resolvedMethod = replaceTemplateVariables(method, context.variables);
          const resolvedArgs = args.map(arg =>
            typeof arg === "string" ? replaceTemplateVariables(arg, context.variables) : arg
          );
    
          const resolver = HostResolver.getInstance();
          const service = resolver.resolve(resolvedHostname).serviceByName(resolvedTarget);
          if (!service || typeof service[resolvedMethod] !== "function") {
            throw new Error(
              `Service '${resolvedTarget}' on host '${resolvedHostname}' does not have a method '${resolvedMethod}'`
            );
          }
          console.log(`[conditional.ts] - will attempt with resolve-condition: hostname: ${resolvedHostname} target: ${resolvedTarget} method: ${resolvedMethod} args: ${resolvedArgs}`);
          conditionResult = service[resolvedMethod](...resolvedArgs);
        } else {
          throw new Error(`Invalid condition format: ${JSON.stringify(condition)}`);
        }
 
        // Execute the appropriate action list
        const actionsToExecute = conditionResult ? thenActions : elseActions;
        console.log("[conditional.ts] RESULT: "+conditionResult);
        await context.executeAdditionalActions(actionsToExecute);
      }
}