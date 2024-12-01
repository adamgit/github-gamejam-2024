import MissionManager from "./MissionManager";
import SimpleTimer from './SimpleTimer';
import { getMissionOS } from './OSForMissions';

export class MissionScheduler_Auto
{
    private readonly manager: MissionManager;
    private clock: SimpleTimer;
    
    public minSecondsBetweenMissions: number = 5;
  
  constructor(manager: MissionManager)
  {
    this.manager = manager;
    if( !this.manager)
        throw new Error("Impossible: constructed with null MissionManager")
    
    this.clock = new SimpleTimer( 100 );
  }

  public startAutoScheduling(): void
  {
    //console.log("starting clock")
    this.clock.start(this.considerSchedulingAMission.bind(this));
  }

  private considerSchedulingAMission()
  {
    //console.log("considering a mission...")
    try
    {

    const validTemplates = this.manager.getEligibleMissionTemplates();

    const currentTime = Date.now();
    const lastEndTime = this.manager.statistics.lastAttemptEndTimeAnyTemplate() ?? 0;

    if( validTemplates.length > 0 && (currentTime-lastEndTime) > this.minSecondsBetweenMissions*1000 )
    {
      if( this.manager.getActiveMissions().length > 0 )
        {
         console.log("[AUTO-scheduler] ... eleigible new missions, but currently "+this.manager.getActiveMissions().length+" in progress, and currently set to only allow one at once; ABORTING") ;
          return;
        }
        const randomTemplate = validTemplates[Math.floor(Math.random() * validTemplates.length)];
        this.manager.startMission( randomTemplate );
    }
  } catch (e) {
    console.error("Critical error in mission scheduler, stopping (will require manual restart):", e);
    this.clock.stop();
  }
  }

}