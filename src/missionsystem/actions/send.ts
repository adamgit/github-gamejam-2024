import { getMissionOS } from '../OSForMissions';
import { ActionHandler, MissionContext } from '../../types/mission';
import { replaceTemplateVariables } from '../template-variables';

export default class SendAction implements ActionHandler {
  async execute(params: [string, string], context: MissionContext): Promise<void> {
    const [target, message] = params;
    const resolvedTarget = replaceTemplateVariables(target, context.variables);
    const resolvedMessage = replaceTemplateVariables(message, context.variables);  

    // was:
    //ServiceRegistriesManager.default['service.chat'].addMessageFrom( resolvedTarget, resolvedMessage);
    // now:
    getMissionOS().chatService.addMessageFrom( resolvedTarget, resolvedMessage);
  }
}