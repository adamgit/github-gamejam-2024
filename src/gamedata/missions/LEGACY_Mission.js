import TimelineManager from './data/timelineManager'; // Import the global TimelineManager

export class Mission {
    constructor(id, timelines = []) {
      this.id = id;
      this.timelines = timelines; // Store timelines but don't auto-register them
      this.started = false;
    }
  
    // Start the mission (register all timelines with the TimelineManager)
    start() {
      if (!this.started) {
        console.log(`Starting mission: ${this.id}`);
        this.timelines.forEach((timeline) => {
          TimelineManager.launchTimeline(timeline.id, timeline.events);
        });
        this.started = true;
      } else {
        console.warn(`Mission: ${this.id} is already started.`);
      }
    }
  
    // ONLY for game-testing and debugging: Reset the mission by cancelling all running timelines and clearing the state
    reset() {
      console.log(`Resetting mission: ${this.id}`);
      this.timelines.forEach((timeline) => {
        TimelineManager.resetTimeline(timeline.id);
      });
      this.started = false;
    }
  
    // Get all timelines for inspection
    inspectTimelines() {
      return this.timelines;
    }
  }