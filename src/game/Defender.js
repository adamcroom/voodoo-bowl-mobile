import {
  HCELLS, VCELLS, CELL, CELL_EMPTY, CELL_ZOMBIE5,
  CELL_SACK_N, CELL_SACK_S, CELL_SACK_E, CELL_SACK_W,
  CELL_TOMB1,
} from '../constants.js';

function rnd(n) { return Math.floor(Math.random() * n); }

export class DefenderManager {
  constructor(field, events) {
    this.field = field;
    this.events = events;
  }

  moveAll(qbX, qbY, gameOver, started) {
    for (let x = 0; x < HCELLS; x++) {
      for (let y = 0; y < VCELLS; y++) {
        const c = this.field.get(x, y);
        if (c === CELL_EMPTY || this.field.isTombstone(c) || this.field.isSack(c)) continue;

        if (this.field.isSpawning(c)) {
          const next = c + 3;
          if (next >= 0) {
            this.field.set(x, y, CELL_ZOMBIE5);
          } else {
            this.field.set(x, y, next);
          }
          continue;
        }

        if (gameOver || !started) continue;

        this.moveOne(c, x, y, qbX, qbY);
      }
    }

    if (!gameOver && qbX >= 0 && started) {
      this.spawnRandom(qbX);
    }
  }

  moveOne(cellType, x, y, qbX, qbY) {
    let tx = x, ty = y;
    const isZombie = this.field.isZombie(cellType);
    const isRef = this.field.isRef(cellType);

    if ((isZombie || isRef) && x > qbX && rnd(2) === 0) {
      if (x > qbX) tx = x - 1;
      else if (x < qbX) tx = x + 1;

      if (ty === y) {
        if (y < qbY) ty = y + 1;
        else if (y > qbY) ty = y - 1;
      }
    } else if (rnd(5) === 0) {
      const dir = rnd(4);
      if (dir === 0) ty = y - 1;
      else if (dir === 1) ty = y + 1;
      else if (dir === 2) tx = x - 1;
      else tx = x + 1;
    } else {
      return;
    }

    if (tx < 0 || tx >= HCELLS || ty < 0 || ty >= VCELLS) return;

    if (isZombie && tx === qbX && ty === qbY) {
      this.field.set(x, y, CELL_EMPTY);
      let sackType;
      if (tx > x) sackType = CELL_SACK_E;
      else if (tx < x) sackType = CELL_SACK_W;
      else if (ty > y) sackType = CELL_SACK_S;
      else sackType = CELL_SACK_N;
      this.field.set(x, y, sackType);
      if (x >= 0 && x < HCELLS && y >= 0 && y < VCELLS) {
        this.field.grass[x][y] = 0;
      }
      this.events.emit('sacked', { x, y, sackType });
      return;
    }

    if (this.field.get(tx, ty) === CELL_EMPTY) {
      this.field.set(tx, ty, cellType);
      this.field.set(x, y, CELL_EMPTY);
      if (isZombie && cellType !== CELL_ZOMBIE5) {
        if (cellType % 2 === 0) this.field.set(tx, ty, cellType + 1);
        else this.field.set(tx, ty, cellType - 1);
      }
    }
  }

  spawnRandom(qbX) {
    if (rnd(4) !== 0) return;
    const sx = qbX + rnd(HCELLS - qbX - 1) + 1;
    const sy = rnd(VCELLS);
    if (sx > 0 && sx < HCELLS && this.field.get(sx, sy) === CELL_EMPTY) {
      this.field.set(sx, sy, -(CELL) + rnd(2));
    }
  }
}
