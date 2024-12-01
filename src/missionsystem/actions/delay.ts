import { ActionHandler, MissionContext } from '../../types/mission';

export default class DelayAction implements ActionHandler {
  async execute(delayMs: number, _context: MissionContext): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}