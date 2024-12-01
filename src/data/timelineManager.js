class TimelineManager {
    constructor() {
      this.timelines = {};
      this.notifications = {}; // Stores registered notifications for synchronization
      this.activeTimers = {}; // Track active timers by timeline ID
    }
  
    // Register a timeline by ID
    launchTimeline(id, timelineEvents) {
      console.log(`Registering timeline: ${id}`);
      this.timelines[id] = {
        events: timelineEvents,
        currentIndex: 0, // Track progress on the timeline
      };
      this.activeTimers[id] = [];
      this.runNextEvent(id); // Start processing the timeline
    }
  
    // Execute the next event in the timeline
    runNextEvent(id) {
        const timeline = this.timelines[id];

        if (timeline.currentIndex >= timeline.events.length) {
            console.log(`Timeline ${id} completed`);
            return; // Stop if we reached the end of the timeline
        }

        const event = timeline.events[timeline.currentIndex];

        if (typeof event.keyframe === "number") {
            // Time-based keyframe
            event.startWaitingTime = Date.now(); // Store the time when the event starts waiting
            event.expectedEndTime = event.startWaitingTime + event.keyframe; // Expected finish time

            console.log(`Timeline ${id}: Event waiting for ${event.keyframe}ms. Expected to finish at ${new Date(event.expectedEndTime)}`);

            // Set timeout and advance to the next event after it finishes
            const timerId = setTimeout(() => {
                event.action();
                this.activeTimers[id].shift(); // Remove completed timer
                timeline.currentIndex++; // Advance to the next event
                this.runNextEvent(id); // Process the next event
            }, event.keyframe);

            this.activeTimers[id].push(timerId);
        } else if (event.keyframe.startsWith("waitFor")) {
            // Condition-based keyframe
            const condition = event.keyframe.match(/waitFor\('(.*)'\)/)[1];
            this.waitFor(condition).then(() => {
                event.action();
                timeline.currentIndex++; // Advance to the next event
                this.runNextEvent(id); // Process the next event
            });
        }
    }
  
    // Wait for a condition or notification
    waitFor(condition, timelineId) {
        return new Promise((resolve) => {
            // Store the resolve function for the condition under this condition name
            if (!this.notifications[condition]) {
                this.notifications[condition] = [];
            }
            this.notifications[condition].push({ timelineId, resolve });
        });
    }

    // Notify all threads waiting for a specific condition
    notifyThreads(condition) {
        if (this.notifications[condition]) {
            // Resolve all promises waiting for this condition
            this.notifications[condition].forEach(({ resolve }) => resolve());
            delete this.notifications[condition]; // Clean up after notification
        }
    }



    // Utility for sleep/delay
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Reset a specific timeline, canceling all timers and clearing the progress
    resetTimeline(id) {
        if (this.timelines[id]) {
            console.log(`Resetting timeline: ${id}`);
            
            // Clear all active timers for this timeline
            this.activeTimers[id].forEach(clearTimeout);
            delete this.activeTimers[id]; // Clear out the timers

            // Remove any unresolved notifications associated with this timeline
            Object.keys(this.notifications).forEach((condition) => {
                this.notifications[condition] = this.notifications[condition].filter(
                    ({ timelineId }) => timelineId !== id
                );
                // Clean up the condition if no more timelines are waiting for it
                if (this.notifications[condition].length === 0) {
                    delete this.notifications[condition];
                }
            });

            delete this.timelines[id];    // Remove the timeline
        }
    }
}
  
  // Export the TimelineManager instance as a singleton
  export default new TimelineManager();
  