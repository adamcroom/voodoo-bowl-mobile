import {
  HCELLS, VCELLS, CELL_EMPTY, CELL_TOMB1, CELL_TOMB2,
  CELL_ZOMBIE3, CELL_ZOMBIE5, CELL_REF1, CELL_REF2,
  CELL_ZOMBIE1, CELL_SACK_N, CELL_SACK_S, CELL_SACK_E, CELL_SACK_W,
  TOMBSTONE_RATIO, GRASS_RATIO, REF_DENSITY, CELL,
} from '../constants.js';

function rnd(n) { return Math.floor(Math.random() * n); }

export class Field {
  constructor() {
    this.grid = [];
    this.grass = [];
    this.reset();
  }

  reset() {
    this.grid = Array.from({ length: HCELLS }, () => Array(VCELLS).fill(CELL_EMPTY));
    this.grass = Array.from({ length: HCELLS }, () => Array(VCELLS).fill(0));
  }

  get(x, y) {
    if (x < 0 || x >= HCELLS || y < 0 || y >= VCELLS) return -1;
    return this.grid[x][y];
  }

  set(x, y, val) {
    if (x >= 0 && x < HCELLS && y >= 0 && y < VCELLS) {
      this.grid[x][y] = val;
    }
  }

  isPassable(x, y) {
    if (x < 0 || x >= HCELLS || y < 0 || y >= VCELLS) return false;
    const c = this.grid[x][y];
    return c === CELL_EMPTY;
  }

  isZombie(c) {
    return c >= 8 && c <= 12;
  }

  isRef(c) {
    return c === CELL_REF1 || c === CELL_REF2;
  }

  isTombstone(c) {
    return c === CELL_TOMB1 || c === CELL_TOMB2;
  }

  isSack(c) {
    return c >= CELL_SACK_N && c <= CELL_SACK_W;
  }

  isSpawning(c) {
    return c < 0;
  }

  placeTombstones() {
    const count = Math.floor(HCELLS * VCELLS * TOMBSTONE_RATIO);
    for (let i = 0; i < count; i++) {
      const x = 2 + rnd(HCELLS - 3);
      const y = rnd(VCELLS);
      if (this.grid[x][y] === CELL_EMPTY) {
        this.grid[x][y] = CELL_TOMB1 + rnd(2);
      }
    }
  }

  placeGrass() {
    const count = Math.floor(HCELLS * VCELLS * GRASS_RATIO);
    for (let i = 0; i < count; i++) {
      const x = rnd(HCELLS);
      const y = rnd(VCELLS);
      this.grass[x][y] = 1 + rnd(3);
    }
  }

  spawnDefenders(qbX, density) {
    const remaining = HCELLS - qbX - 1;
    if (remaining <= 0) return;

    const zombieCount = Math.floor(remaining * VCELLS * density);
    for (let i = 0; i < zombieCount; i++) {
      const sx = qbX + rnd(remaining) + 1;
      const sy = rnd(VCELLS);
      if (sx > 0 && sx < HCELLS - 1 && this.grid[sx][sy] === CELL_EMPTY) {
        this.grid[sx][sy] = CELL_ZOMBIE1 + rnd(2) * 2;
      }
    }

    const refCount = Math.floor(remaining * VCELLS * REF_DENSITY);
    for (let i = 0; i < refCount; i++) {
      const sx = qbX + rnd(remaining) + 1;
      const sy = rnd(VCELLS);
      if (sx > 0 && sx < HCELLS - 1 && this.grid[sx][sy] === CELL_EMPTY) {
        this.grid[sx][sy] = CELL_REF1 + rnd(2);
      }
    }
  }

  spawnProtectiveWall(qbX, qbY) {
    const wx = qbX + 1;
    if (wx >= HCELLS) return;
    for (let dy = -1; dy <= 1; dy++) {
      const wy = qbY + dy;
      if (wy >= 0 && wy < VCELLS && this.grid[wx][wy] === CELL_EMPTY) {
        this.grid[wx][wy] = CELL_ZOMBIE3;
      }
    }
  }

  clearNonTombstones() {
    for (let x = 0; x < HCELLS; x++) {
      for (let y = 0; y < VCELLS; y++) {
        const c = this.grid[x][y];
        if (this.isZombie(c) || this.isRef(c) || this.isSack(c) || this.isSpawning(c)) {
          this.grid[x][y] = CELL_EMPTY;
        }
      }
    }
  }
}
