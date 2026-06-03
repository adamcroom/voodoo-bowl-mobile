import { VCELLS, HCELLS, CELL } from '../constants.js';

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.y = Math.floor(VCELLS / 2);
    this.frame = 0;
    this.depth = CELL - 3;
    this.hesitating = false;
    this.sprinting = false;
    this.consecutiveHesitations = 0;
  }

  dodgeUp() {
    if (this.y > 0) {
      this.y--;
      return true;
    }
    return false;
  }

  dodgeDown() {
    if (this.y < VCELLS - 1) {
      this.y++;
      return true;
    }
    return false;
  }

  sprint() {
    this.sprinting = true;
  }

  hesitate(maxConsecutive) {
    if (this.consecutiveHesitations < maxConsecutive) {
      this.hesitating = true;
      this.consecutiveHesitations++;
      return true;
    }
    return false;
  }

  autoAdvance() {
    if (this.hesitating) {
      this.hesitating = false;
      return false;
    }

    let cells = 1;
    if (this.sprinting) {
      cells = 2;
      this.sprinting = false;
    }

    this.consecutiveHesitations = 0;

    let moved = false;
    for (let i = 0; i < cells; i++) {
      if (this.x < HCELLS - 1) {
        this.x++;
        moved = true;
      }
    }

    this.frame = (this.frame + 1) % 4;
    return moved;
  }

  updateDepth() {
    if (this.depth > 0) {
      this.depth = Math.max(0, this.depth - 7);
    }
  }

  atEndzone() {
    return this.x >= HCELLS - 1;
  }
}
