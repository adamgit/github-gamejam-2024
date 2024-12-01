// gameServices.ts
import MissionManager from './missionsystem/MissionManager'
import { MissionScheduler_Auto } from './missionsystem/MissionScheduler';

/**
 * Centralises game-logic that has to be global / instantiated once, but 
 * which is NOT fundamentally part of the UI (it exists outside the UI)
 */
export class GameServices {
  private static instance: GameServices;
  private missionManager: MissionManager;
  private missionScheduler: MissionScheduler_Auto;

  private constructor(delayBeforeFirstMissionInSeconds?: number) {
    this.missionManager = new MissionManager();
    this.missionScheduler = new MissionScheduler_Auto(this.missionManager);

    console.log("--------- GameServices will NOT auto-start; awaiting a call to startAutoScheduling ---------");
  }

  public startAutoScheduling(delayBeforeFirstMissionInSeconds?: number) {
    if (delayBeforeFirstMissionInSeconds)
      setTimeout(() => {
        console.log(`Starting (delayed by ${delayBeforeFirstMissionInSeconds} seconds) auto-scheduler for missions...`)
        this.missionScheduler.startAutoScheduling();
      }, delayBeforeFirstMissionInSeconds * 1000)
    else
{      console.log("Starting auto-scheduler for missions...")
    this.missionScheduler.startAutoScheduling();
}
  }

  public static init() {
    if (!GameServices.instance) {
      GameServices.instance = new GameServices(4);
    }
    return GameServices.instance;
  }

  static get missions() {
    return this.instance?.missionManager;
  }
}