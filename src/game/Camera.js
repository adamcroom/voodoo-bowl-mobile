import { HCELLS, VIEWW } from '../constants.js';

export class Camera {
  constructor() {
    this.x = 0;
    this.targetX = 0;
    this.lerpSpeed = 0.15;
  }

  reset() {
    this.x = 0;
    this.targetX = 0;
  }

  update(qbX) {
    const maxView = HCELLS - VIEWW;
    this.targetX = Math.max(0, Math.min(maxView, qbX - Math.floor(VIEWW / 4)));
    this.x += (this.targetX - this.x) * this.lerpSpeed;
    this.x = Math.max(0, Math.min(maxView, this.x));
  }

  snap(qbX) {
    const maxView = HCELLS - VIEWW;
    this.x = Math.max(0, Math.min(maxView, qbX - Math.floor(VIEWW / 4)));
    this.targetX = this.x;
  }
}
