/**
 * Used to track how many times a mission has been scheduled, completed, failed
 * 
 * This is NOT cosmetic! It actually drives game-logic, so be careful with it...
 */

import { TemplateID } from "../types/mission";

export class MissionStatistics {
    private startCounts: Map<TemplateID, number> = new Map();
    private successCounts: Map<TemplateID, number> = new Map();
    private failureCounts: Map<TemplateID, number> = new Map();

    /** Ugly code written by Claude - such a stupid way to implement this, but I can't be bothered to write it correctly
     * right now, just accept that Claude writes really bad code by default
     */
    private startTimes: Map<TemplateID, number> = new Map();
    private endTimes: Map<TemplateID, number> = new Map();
  
    public recordStart(templateID: TemplateID): void {
      const currentCount = this.startCounts.get(templateID) || 0;
      this.startCounts.set(templateID, currentCount + 1);
      this.startTimes.set(templateID, Date.now());
    }
  
    public recordSuccess(templateID: TemplateID): void {
      const currentCount = this.successCounts.get(templateID) || 0;
      this.successCounts.set(templateID, currentCount + 1);
      this.endTimes.set(templateID, Date.now());
    }
  
    public recordFailure(templateID: TemplateID): void {
      const currentCount = this.failureCounts.get(templateID) || 0;
      this.failureCounts.set(templateID, currentCount + 1);
      this.endTimes.set(templateID, Date.now());
    }
  
    /*
    public getStartedMissions():string[]
    {
        return Array.from(this.startCounts.keys());
    }
    public getSucceededMissions():string[]
    {
        return Array.from(this.startCounts.keys());
    }
*/

    public getStartCount(templateID: TemplateID): number {
      return this.startCounts.get(templateID) || 0;
    }
  
    public getSuccessCount(templateID: TemplateID): number {
      return this.successCounts.get(templateID) || 0;
    }
  
    public getFailureCount(templateID: TemplateID): number {
      return this.failureCounts.get(templateID) || 0;
    }

    public lastAttemptStartTime(templateID: TemplateID): number | undefined
    {
        return this.startTimes.get(templateID);
    }
    public lastAttemptEndTime(templateID: TemplateID): number | undefined
    {
        return this.endTimes.get(templateID);
    }

    /**
     * Returns the latest end time across all templates.
     */
    public lastAttemptEndTimeAnyTemplate(): number | undefined {
          return Array.from(this.endTimes.values()).reduce((latest, current) => 
              current > latest ? current : latest, -Infinity);
      }
  }