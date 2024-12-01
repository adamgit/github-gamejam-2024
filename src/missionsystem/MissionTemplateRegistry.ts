import { MissionAction, MissionTemplate } from '../types/mission';

/**
 * Required by typescript, otherwise it refuses to use Webpack's feature
 */
declare const require: {
    context(
      directory: string,
      useSubdirectories: boolean,
      regExp: RegExp
    ): {
      keys(): string[];
      <T>(id: string): T;
    };
  };


class MissionTemplateRegistry {
  private templates: Map<string, MissionTemplate> = new Map();

  constructor() {
    this.scanMissions();
  }

  public scanMissions(): void
  {
    console.log("Scanning for missions in project...")
    const ms = this.loadMissions();

    ms.map( (m) => this.templates.set(m.templateID, m) );
  }

  private loadMissions = (): MissionTemplate[] => {
    // Webpack's require.context to find all mission.js files in missions folder and subfolders
    const context = require.context(
        '../gamedata',
        true,  // Search subdirectories - this is now important!
        /missions\/[^\/]+\/mtemplate\.js$/  // Match mission.ts in mission subfolders
    );
    
    // Get all matching file paths
    const missionPaths = context.keys();
    

    return missionPaths.map(path => {
        // When using CommonJS module.exports, the actual module is in the 'default' property
        const imported = context(path) as any;
        const template = imported.__esModule ? imported.default : imported;

        return template as MissionTemplate;
      });
  };

  private isMissionTemplate(obj: any): obj is MissionTemplate {
    console.log( `mid = ${obj.missionId}, tilte = ${obj.title}, obj = ${JSON.stringify(obj)}`)
    return obj && 
           typeof obj.missionId === 'string' &&
           typeof obj.title === 'string' &&
           typeof obj.createMission === 'function' &&
           obj.eventsInitial && 
           obj.events;
  }

  public getMissionTemplates(): MissionTemplate[] {
    //console.log(`templates all: ${JSON.stringify(this.templates)}`)
    return Array.from(this.templates.values());
  }

  public getMissionTemplate(id: string): MissionTemplate | undefined {
    return this.templates.get(id);
  }
}

// Export a singleton instance of the MissionsManager
export default MissionTemplateRegistry;