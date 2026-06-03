import {
  TICK_MS, SACK_PAUSE_MS, TD_PAUSE_MS,
  TD_POINTS, REF_POINTS, MAX_HESITATIONS,
  INITIAL_DENSITY, DENSITY_SCALE, VCELLS,
  CELL_TOMB1,
} from '../constants.js';
import { Field } from './Field.js';
import { Player } from './Player.js';
import { DefenderManager } from './Defender.js';
import { Camera } from './Camera.js';
import { Timer } from './Timer.js';
import { Downs } from './Downs.js';
import { EventBus } from '../utils/EventBus.js';
import { InputManager } from '../input/InputManager.js';
import { Renderer } from '../render/Renderer.js';

export class Game {
  constructor(canvas) {
    this.events = new EventBus();
    this.renderer = new Renderer(canvas);
    this.input = new InputManager(canvas, this.events);
    this.field = new Field();
    this.player = new Player();
    this.defenders = new DefenderManager(this.field, this.events);
    this.camera = new Camera();
    this.timer = new Timer();
    this.downs = new Downs();

    this.state = 'MENU';
    this.score = 0;
    this.density = INITIAL_DENSITY;
    this.tick = 0;
    this.gameOver = false;
    this.sacked = false;
    this.touchdown = false;
    this.pauseTime = 0;
    this.message = '';
    this.started = false;

    this.events.on('sacked', (data) => this.onSacked(data));

    this.lastTick = 0;
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  newGame() {
    this.field.reset();
    this.player.reset();
    this.camera.reset();
    this.timer.reset();
    this.downs.reset();

    this.score = 0;
    this.density = INITIAL_DENSITY;
    this.tick = 0;
    this.gameOver = false;
    this.sacked = false;
    this.touchdown = false;
    this.pauseTime = 0;
    this.message = '';
    this.started = false;

    this.field.placeTombstones();
    this.field.placeGrass();

    this.player.x = 0;
    this.player.y = Math.floor(VCELLS / 2);
    this.downs.startPlay(0);

    const savedDensity = this.density;
    this.density = 0;
    this.field.spawnDefenders(0, 0);
    this.field.spawnProtectiveWall(0, this.player.y);
    this.density = savedDensity;

    const refCount = Math.floor(39 * VCELLS * 0.02);
    for (let i = 0; i < refCount; i++) {
      const sx = 1 + Math.floor(Math.random() * 38);
      const sy = Math.floor(Math.random() * VCELLS);
      if (this.field.get(sx, sy) === 0) {
        this.field.set(sx, sy, 6 + Math.floor(Math.random() * 2));
      }
    }

    this.camera.snap(0);
  }

  startGame() {
    this.newGame();
    this.state = 'PLAYING';
    this.started = true;
    this.timer.start();
    this.message = this.downs.label();
  }

  onSacked() {
    this.sacked = true;
    this.pauseTime = Date.now() + SACK_PAUSE_MS;
    this.timer.pause();
    this.message = 'SACKED!';
  }

  checkCollisionAtQB() {
    if (this.sacked) return;
    const c = this.field.get(this.player.x, this.player.y);
    if (c === 0) return;

    if (this.field.isZombie(c) || this.field.isSpawning(c)) {
      this.field.set(this.player.x, this.player.y, 0);
      this.onSacked();
      return;
    }

    if (this.field.isRef(c)) {
      this.field.set(this.player.x, this.player.y, CELL_TOMB1 + Math.floor(Math.random() * 2));
      this.score += REF_POINTS;
      return;
    }
  }

  canAdvanceTo(x, y) {
    const c = this.field.get(x, y);
    return c === 0 || this.field.isRef(c) || this.field.isZombie(c) || this.field.isSpawning(c);
  }

  endDown() {
    this.sacked = false;
    this.pauseTime = 0;

    if (this.gameOver) return;

    if (this.touchdown) {
      this.touchdown = false;
      this.player.x = 0;
      this.player.y = Math.floor(VCELLS / 2);
      this.player.depth = 37;
      this.camera.snap(0);
      this.downs.touchdownReset();
      this.density *= DENSITY_SCALE;
      this.field.clearNonTombstones();
      this.field.spawnDefenders(0, this.density);
      this.field.spawnProtectiveWall(0, this.player.y);
      this.timer.start();
      this.message = '1st & 10 — Keep going!';
      this.downs.startPlay(0);
      return;
    }

    if (this.downs.isTurnover(this.player.x) || this.timer.expired()) {
      this.gameOver = true;
      this.timer.pause();
      if (this.timer.expired()) {
        this.message = `Time's up! Score: ${this.score}`;
      } else {
        this.message = `Turnover on downs! Score: ${this.score}`;
      }
      return;
    }

    this.downs.advance(this.player.x);
    this.player.y = Math.floor(VCELLS / 2);
    this.player.depth = 37;
    this.player.frame = 0;
    this.field.clearNonTombstones();
    this.field.spawnDefenders(this.player.x, this.density);
    this.field.spawnProtectiveWall(this.player.x, this.player.y);
    this.camera.snap(this.player.x);
    this.timer.start();
    this.message = this.downs.label();
    this.downs.startPlay(this.player.x);
  }

  updatePlaying(actions) {
    if (this.pauseTime > 0) {
      if (Date.now() > this.pauseTime) {
        this.endDown();
      }
      return;
    }

    if (this.gameOver) {
      for (const a of actions) {
        if (a === 'tap') {
          this.state = 'MENU';
          return;
        }
      }
      return;
    }

    for (const action of actions) {
      if (this.sacked || this.touchdown) break;
      if (action === 'dodgeUp') {
        const targetY = this.player.y - 1;
        if (targetY >= 0) {
          const c = this.field.get(this.player.x, targetY);
          if (!this.field.isTombstone(c)) {
            this.player.dodgeUp();
            this.checkCollisionAtQB();
          }
        }
      } else if (action === 'dodgeDown') {
        const targetY = this.player.y + 1;
        if (targetY < VCELLS) {
          const c = this.field.get(this.player.x, targetY);
          if (!this.field.isTombstone(c)) {
            this.player.dodgeDown();
            this.checkCollisionAtQB();
          }
        }
      } else if (action === 'sprint') {
        this.player.sprint();
      } else if (action === 'hesitate') {
        this.player.hesitate(MAX_HESITATIONS);
      }
    }
  }

  gameTick() {
    if (this.state !== 'PLAYING') return;
    this.tick++;

    if (!this.gameOver && this.pauseTime === 0 && !this.sacked && !this.touchdown) {
      const nextX = this.player.x + 1;
      if (nextX < 40 && !this.canAdvanceTo(nextX, this.player.y)) {
        this.player.hesitating = true;
      }
      this.player.autoAdvance();
      this.checkCollisionAtQB();

      if (this.player.atEndzone() && !this.sacked) {
        this.score += TD_POINTS;
        this.touchdown = true;
        this.pauseTime = Date.now() + TD_PAUSE_MS;
        this.timer.pause();
        this.downs.touchdownReset();
        this.message = 'TOUCHDOWN! +7 pts!';
      }
    }

    this.defenders.moveAll(this.player.x, this.player.y, this.gameOver, this.started);
    this.player.updateDepth();
    this.camera.update(this.player.x);
  }

  loop(ts) {
    if (ts - this.lastTick >= TICK_MS) {
      this.lastTick = ts;

      const actions = this.input.poll();

      if (this.state === 'MENU') {
        for (const a of actions) {
          if (a === 'tap') this.startGame();
        }
      } else if (this.state === 'PLAYING') {
        this.updatePlaying(actions);
        this.gameTick();
      }
    }

    this.render();
    requestAnimationFrame(this.loop);
  }

  render() {
    this.renderer.clear();
    if (this.state === 'MENU') {
      this.renderer.drawStartScreen();
    } else if (this.state === 'PLAYING') {
      this.renderer.drawGame(this.field, this.player, this.camera, {
        gameOver: this.gameOver,
        sacked: this.sacked,
        touchdown: this.touchdown,
        tick: this.tick,
      });
      this.renderer.drawHUD(
        this.score,
        this.timer.remainingSeconds(),
        this.downs.label(),
        this.message,
      );
    }
  }
}
