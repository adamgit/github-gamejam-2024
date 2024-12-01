import { ActionHandler, MissionContext } from '../../types/mission';
import { replaceTemplateVariables } from '../template-variables';
import { GameServices } from '../../gameServices';

export default class MissionSucceededAction implements ActionHandler {
  async execute(params: [string, string], context: MissionContext): Promise<void> {
    const [message] = params;
    const resolvedMessage = replaceTemplateVariables(message, context.variables);

    console.log(`*********** SUCCEEDED mission: ${resolvedMessage}`);
    const mission = GameServices.missions.endMissionSuccess(context.missionId, context.template.templateID);
  }
}