export class Downs {
  constructor() {
    this.reset();
  }

  reset() {
    this.down = 1;
    this.toFirst = 10;
    this.scrimmage = 0;
  }

  startPlay(qbX) {
    this.scrimmage = qbX;
  }

  endPlay(qbX) {
    const gained = qbX - this.scrimmage;
    return { gained, toFirst: this.toFirst - gained };
  }

  advance(qbX) {
    const gained = qbX - this.scrimmage;
    this.toFirst -= gained;
    if (this.toFirst <= 0) {
      this.down = 1;
      this.toFirst = 10;
    } else {
      this.down++;
    }
    this.scrimmage = qbX;
  }

  isTurnover(qbX) {
    const { toFirst } = this.endPlay(qbX);
    return this.down === 4 && toFirst > 0;
  }

  touchdownReset() {
    this.down = 1;
    this.toFirst = 10;
    this.scrimmage = 0;
  }

  label() {
    const names = ['1st', '2nd', '3rd', '4th'];
    return `${names[Math.min(this.down - 1, 3)]} & ${Math.max(this.toFirst, 0)}`;
  }
}
