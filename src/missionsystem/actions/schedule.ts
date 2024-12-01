import { ActionHandler, MissionContext } from '../../types/mission';

export default class ScheduleAction implements ActionHandler {
  async execute(eventName: string, context: MissionContext): Promise<void> {
    if (typeof eventName !== 'string') throw new Error(`eventName must be string, got: ${typeof eventName} with value: ${JSON.stringify(eventName)}`);

    //console.log("EVENT_ACTION.Schedule: will schedule event: "+context.template.missionId+"."+eventName)
    context.scheduleEvent(eventName);
  }
}
