import { GAME_TIME_MS } from '../constants.js';

export class Timer {
  constructor() {
    this.reset();
  }

  reset() {
    this.usedTime = 0;
    this.startTime = 0;
  }

  start() {
    if (this.startTime === 0) {
      this.startTime = Date.now();
    }
  }

  pause() {
    if (this.startTime > 0) {
      this.usedTime += Date.now() - this.startTime;
      this.startTime = 0;
    }
  }

  elapsed() {
    let t = this.usedTime;
    if (this.startTime > 0) t += Date.now() - this.startTime;
    return t;
  }

  remaining() {
    return Math.max(0, GAME_TIME_MS - this.elapsed());
  }

  remainingSeconds() {
    return Math.ceil(this.remaining() / 1000);
  }

  expired() {
    return this.usedTime >= GAME_TIME_MS;
  }
}
