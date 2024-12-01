/**
 * Note: ChatGPT has been nerfed by OpenAI and keeps trying to overwrite this with 'NodeJS' classes,
 * despite being told explicitly it's editing a React app - which makes any/all NodeJS code
 * literally garbage.
 */
class SimpleTimer {
    private intervalId: number | null = null; // Use `number` for browser compatibility
    private isRunning: boolean = false;
    private interval: number;
  
    constructor(interval: number = 1000) {
      this.interval = interval; // Interval in milliseconds
    }
  
    // Starts or resumes the timer
    start(callback: () => void): void {
      if (this.isRunning) return;
  
      this.isRunning = true;
      this.intervalId = window.setInterval(() => {
        callback();
      }, this.interval);
    }
  
    // Pauses the timer
    pause(): void {
      if (this.intervalId !== null) {
        window.clearInterval(this.intervalId);
        this.intervalId = null;
        this.isRunning = false;
      }
    }
  
    // Stops the timer completely
    stop(): void {
      this.pause();
    }
  }
  
  export default SimpleTimer;