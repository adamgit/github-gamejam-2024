import { EventStatus, MissionEvent, MissionTemplate, TemplateID } from "../types/mission";
import { Mission } from "./mission";
import MissionTemplateRegistry from "./MissionTemplateRegistry";
import {MissionUnlocker} from './MissionUnlocker';
import {MissionStatistics} from './MissionStatistics';
import { getFailableMissionOS, getMissionOS } from "./OSForMissions";

export interface MissionStatus {
  id: string;
  template: MissionTemplate;
  variables: Record<string, string>;
  events: Array<{
    name: string,
    status: EventStatus
  }>;
}

// Assuming the MissionScheduler exposes these methods
interface IMissionScheduler {
    getActiveMissions(): MissionStatus[];
  }  

class MissionManager implements IMissionScheduler {
  private registry: MissionTemplateRegistry;
  public locker: MissionUnlocker;
  public statistics: MissionStatistics;

  private activeMissions: Map<string, Mission> = new Map();
  private nextMissionId: number = 1;

  constructor() {
    this.registry = new MissionTemplateRegistry();
    this.locker = new MissionUnlocker();
    this.statistics = new MissionStatistics();
  }

  public getActiveMissions(): MissionStatus[] {
    return Array.from(this.activeMissions.entries()).map(([id, mission]) => ({
      id,
      template: mission.getTemplate(),
      variables: mission.getVariables(),
      events: this.getEventStatuses(mission)
    }));
  }

  public countAttemptedByTemplate( templateID: TemplateID): number
  {
    return this.statistics.getStartCount(templateID);
  }
  public countSucceededByTemplate( templateID: TemplateID): number
  {
    return this.statistics.getSuccessCount(templateID);
  }
  public countFailedByTemplate( templateID: TemplateID): number
  {
    return this.statistics.getFailureCount(templateID);
  }

  public getAllMissionTemplates(): MissionTemplate[] {
    return this.registry.getMissionTemplates();
  }

  public getEligibleMissionTemplates(): MissionTemplate[] {
    return this.registry.getMissionTemplates().filter(template => 
      this.canStartMission(template)
    );
  }

  private inProgressInstancesOf( template:MissionTemplate ): number
  {
    return Array.from(this.activeMissions.values()).reduce(
      (count, mission) => (mission.getTemplate() == template) ? count + 1 : count, 0);
  }

    private activeMission( missionID:string ): MissionStatus | undefined
    {
      const mission = this.activeMissions.get(missionID);
      
      if (!mission) {
        return undefined; // or throw an error if you prefer
      }
    
      return {
        id: missionID,
        template: mission.getTemplate(),
        variables: mission.getVariables(),
        events: this.getEventStatuses(mission)
      };
    }

  public endMissionSuccess( mid: string, templateID: TemplateID )
  {
    this.statistics.recordSuccess(templateID);

    const status = this.activeMission(mid);

    if( ! status )
    {
      throw new Error(`BADLY wrong; in calling endMissionSuccess( ${mid}, ${templateID} ), we ended up with an empty result for the call to 'this.activeMission(${mid})`);
    }
    
    // mission effects:
    this.locker.unlock( status.template.successUnblocks );
    this.locker.lock( status.template.successBlocks );
    if( status.template.reward )
    {
      console.log("[end-mission: succeeded] Found a mission-reward...")
      const reward = status.template.reward;

      if( reward.bytecoins )
        getMissionOS().walletService.addCoins(reward.bytecoins);
      if( reward.install )
      {
        console.log('will grant rewards');
        if (Array.isArray(reward.install))
          {
            console.log("reward.install is array, will do foreach... (array: "+JSON.stringify(reward.install))
          reward.install.forEach(appName => {
            console.log(`...installing '${appName}'`)
              getMissionOS().installAppNamed(appName);
          });
      }
       else
        {
          console.log("reward.install is string will do 1x")
          console.log(`...installing '${reward.install}'`)
          getMissionOS().installAppNamed(reward.install);
      }
      }
      if( reward.reputation )
        getMissionOS().repService.alterReputation( reward.reputation );
    }

    this.activeMissions.delete(mid);
  }
  public endMissionFailure( mid: string, templateID: TemplateID )
  {
    this.statistics.recordFailure(templateID);

    this.activeMissions.delete(mid);
  }

  private getEventStatuses(mission: Mission): MissionStatus['events'] {
    return mission.getEventStatuses();
  }

  public isMissionUnlocked( template:MissionTemplate): boolean
  {
    /** Check the 'locked / keys' state */
    const blockingKeysPresent = this.locker?.areAnyKeysLocked(template.blockedBy);
    const unblockingKeysPresent = this.locker?.areAllKeysUnlocked(template.blockedUntil ?? []);

    return !blockingKeysPresent && unblockingKeysPresent;
  }

  public isMissionResourceMet( template:MissionTemplate): boolean
  {
    const repServiceOrNull = getFailableMissionOS()?.repService;
    const hasMinRep: boolean = template.requiresMinReputation
    ? (repServiceOrNull && repServiceOrNull.getReputation() !== undefined
        ? repServiceOrNull.getReputation() >= template.requiresMinReputation
        : true)
    : true;

    return hasMinRep;
  }
  
  public isMissionParallelizable( template:MissionTemplate): boolean
  {
    const alreadyRunning = this.inProgressInstancesOf(template);
    const canRunAdditionalInstances = alreadyRunning < (template.maxConcurrentInstances ?? Infinity);

    return canRunAdditionalInstances;
  }

  public isMissionRerunnable( template:MissionTemplate): boolean
  {
    //const startCount = this.statistics.getStartCount(template.missionId);
    const successCount = this.statistics.getSuccessCount(template.templateID);
    const withinMaxCompletionsLimit = successCount < (template.maxSuccessCompletions ?? Infinity);
    //const withinMaxAttemptsLimit = startCount < (template.)

    return withinMaxCompletionsLimit;
  }

  public hasMissionWaitedEnoughBetweenRetries( template:MissionTemplate): boolean
  {
    const lastStartTime = this.statistics.lastAttemptStartTime(template.templateID) ?? 0;
    const lastEndTime = this.statistics.lastAttemptEndTime(template.templateID) ?? 0;

    const lastAttemptTime = Math.max(lastStartTime, lastEndTime);
    
    const nextEligibleStartTime = lastAttemptTime + (template.minSecondsBeforeRetryAfterFailure??0)*1000;
    const enoughGapBetweenAttempts = nextEligibleStartTime < Date.now();
    
    return enoughGapBetweenAttempts;
  }

  /**
   * Internally uses the isMissionXXX(..)/hasMission(..) methods sequentially and only returns true if all
   * are true - enabling you to query exactly WHY a mission can't be started in finer granularity if needed
   * 
   * @param template 
   * @returns 
   */
  public canStartMission(template:MissionTemplate): boolean
  {
    /** Check the 'locked / keys' state */
    const isTemplateUnlocked = this.isMissionUnlocked(template);
    if( !isTemplateUnlocked )
      return false;

    const hasMinResource = this.isMissionResourceMet( template);
    if( !hasMinResource )
      return false;

    const canRunMoreAtOnce = this.isMissionParallelizable(template);
    if( !canRunMoreAtOnce )
      return false;

    /** Check that the template hasn't already been completed its max number of times */
    const withinMaxCompletionsLimit = this.isMissionRerunnable(template);
    if( !withinMaxCompletionsLimit )
      return false;

    const enoughGapBetweenAttempts = this.hasMissionWaitedEnoughBetweenRetries(template);
    if( !enoughGapBetweenAttempts )
      return false;

    return true;
  }
  public startMission(template: MissionTemplate, ignoreRequirements?:boolean): string {
    try {
      if( !ignoreRequirements && !this.canStartMission(template))
        throw new Error(`One or more of the required unlocked keys (${JSON.stringify(template.blockedUntil)}) has not yet been unlocked, cannot start missions from template: ${template}`);

      // Generate mission variables
      const variables = template.createMission();

      console.log(`Starting Mission ${template.templateID} using variables: ${JSON.stringify(variables)}`);
      
      // Create unique mission ID
      const missionId = `mission_${this.nextMissionId++}`;
      
      // Create and store new mission instance
      const mission = new Mission(missionId, template, variables);
      this.activeMissions.set(missionId, mission);

      // Start the mission
      this.statistics.recordStart(template.templateID);
      mission.start();

      return missionId;
    } catch (error) {
      console.error('Error starting mission:', error);
      throw error;
    }
  }



  
  public async cancelMission(missionId: string): Promise<void> {
    const mission = this.activeMissions.get(missionId);
    if (mission) {
      alert( "mission cancellation NIY");
      /*
      await mission.cancel();
      this.activeMissions.delete(missionId);*/
    }
  }
}

// Export a singleton instance of the MissionsManager
export default MissionManager;