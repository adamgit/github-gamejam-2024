import { GameServices } from '../../gameServices';
import { ActionHandler, MissionContext } from '../../types/mission';
import { replaceTemplateVariables } from '../template-variables';

export default class MissionFailedAction implements ActionHandler {
  async execute(params: [string, string], context: MissionContext): Promise<void> {
    const [message] = params;
    const resolvedMessage = replaceTemplateVariables(message, context.variables);

    console.log(`*********** FAILED mission: ${resolvedMessage}`);
    const mission = GameServices.missions.endMissionFailure(context.missionId, context.template.templateID);
  }
}