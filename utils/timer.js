export class GlobalOrchestratorFactory { //most bullshit name i can think of LOL
     timers = [];

     constructor() {
          window.addEventListener("timerPause", async (event) => { this._pause(); });
          window.addEventListener("timerStart", async (event) => { this._start(); });
     }

     createTimer() {
          let t = new Timer();
          this.timers.push(t);
          t.start();
          return t;
     }

     _pause() {
          for (let t of this.timers) t.pause();
     }

     _start() {
          for (let t of this.timers) t.start();
     }

}

class Timer {
     started = false;
     elapsedOffset = 0;
     startTime = null;

     start() {
          if (this.started) return;
          this.startTime = Date.now();
          this.started = true;
     }

     pause() {
          if (!this.started) return;
          this.started = false;
          let elapsedMs = Date.now() - this.startTime;
          this.elapsedOffset += elapsedMs;
          this.startTime = null;
     }

     getElapsed() {
          if (!this.started) {
               return this.elapsedOffset;
          } else {
               let elapsedMs = Date.now() - this.startTime;
               return this.elapsedOffset + elapsedMs;
          }
     }
}