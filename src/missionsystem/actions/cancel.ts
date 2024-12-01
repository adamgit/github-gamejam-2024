import { ActionHandler, MissionContext } from '../../types/mission';

export default class CancelAction implements ActionHandler {
  async execute(eventName: string, context: MissionContext): Promise<void> {
    await context.cancelEvent(eventName);
  }
}
