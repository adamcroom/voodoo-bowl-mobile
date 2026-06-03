import {
  CELL, VCELLS, HCELLS, VIEWW, VIEW_PX, FIELD_H,
  CELL_EMPTY, CELL_REF1, CELL_REF2, CELL_TOMB1, CELL_TOMB2,
  CELL_SACK_N, CELL_SACK_S, CELL_SACK_E, CELL_SACK_W,
  COLORS,
} from '../constants.js';

const HUD_H = 80;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const gameW = VIEW_PX;
    const gameH = FIELD_H + HUD_H;
    const scaleX = window.innerWidth / gameW;
    const scaleY = window.innerHeight / gameH;
    const scale = Math.min(scaleX, scaleY);
    this.canvas.width = gameW;
    this.canvas.height = gameH;
    this.canvas.style.width = `${gameW * scale}px`;
    this.canvas.style.height = `${gameH * scale}px`;
  }

  drawGame(field, player, camera, gameState) {
    const ctx = this.ctx;
    const camX = camera.x;

    ctx.fillStyle = COLORS.field;
    ctx.fillRect(0, 0, VIEW_PX, FIELD_H);

    for (let i = 0; i < VIEWW + 1; i++) {
      const fx = Math.floor(camX) + i;
      const screenX = (i - (camX % 1)) * CELL;

      if (fx >= 0 && fx < HCELLS && fx % 2 === 0) {
        ctx.fillStyle = COLORS.fieldAlt;
        ctx.fillRect(screenX, 0, CELL, FIELD_H);
      }

      if (fx > 1 && fx < HCELLS - 1 && fx % 5 === 0) {
        ctx.fillStyle = COLORS.yardLine;
        ctx.fillRect(screenX + CELL / 2 - 1, 0, 2, FIELD_H);
      }
    }

    const endLeft = (0 - camX) * CELL;
    if (endLeft > -CELL * 2) {
      ctx.fillStyle = COLORS.endzone;
      ctx.fillRect(endLeft, 0, CELL, FIELD_H);
    }
    const endRight = (HCELLS - 1 - camX) * CELL;
    if (endRight < VIEW_PX + CELL) {
      ctx.fillStyle = COLORS.endzone;
      ctx.fillRect(endRight, 0, CELL, FIELD_H);
    }

    for (let i = -1; i < VIEWW + 2; i++) {
      const fx = Math.floor(camX) + i;
      if (fx < 0 || fx >= HCELLS) continue;
      const screenX = (fx - camX) * CELL;

      for (let y = 0; y < VCELLS; y++) {
        if (field.grass[fx] && field.grass[fx][y] > 0) {
          ctx.fillStyle = COLORS.grass;
          const gx = screenX + CELL / 2 - 3;
          const gy = y * CELL + CELL / 2 - 3;
          ctx.fillRect(gx, gy, 6, 6);
        }

        const c = field.get(fx, y);
        if (c === CELL_EMPTY) continue;

        const cx = screenX;
        const cy = y * CELL;

        if (field.isTombstone(c)) {
          ctx.fillStyle = COLORS.tombstone;
          ctx.fillRect(cx + 8, cy + 10, 24, 20);
          ctx.fillRect(cx + 14, cy + 4, 12, 6);
        } else if (field.isZombie(c)) {
          ctx.fillStyle = COLORS.zombie;
          if (c % 2 === 1) ctx.fillStyle = COLORS.zombieAlt;
          ctx.fillRect(cx + 6, cy + 4, 28, 32);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(cx + 10, cy + 10, 6, 6);
          ctx.fillRect(cx + 22, cy + 10, 6, 6);
          ctx.fillStyle = '#CC2222';
          ctx.fillRect(cx + 12, cy + 12, 2, 2);
          ctx.fillRect(cx + 24, cy + 12, 2, 2);
        } else if (field.isRef(c)) {
          ctx.fillStyle = COLORS.ref;
          ctx.fillRect(cx + 8, cy + 4, 24, 32);
          ctx.fillStyle = '#000000';
          ctx.fillRect(cx + 10, cy + 8, 4, 4);
          ctx.fillRect(cx + 24, cy + 8, 4, 4);
        } else if (field.isSack(c)) {
          ctx.fillStyle = COLORS.sack;
          ctx.globalAlpha = 0.7;
          if (c === CELL_SACK_N || c === CELL_SACK_S) {
            ctx.fillRect(cx + 4, cy, 32, CELL * 2);
          } else {
            ctx.fillRect(cx, cy + 4, CELL * 2, 32);
          }
          ctx.globalAlpha = 1;
        } else if (field.isSpawning(c)) {
          const progress = 1 - Math.abs(c) / CELL;
          ctx.fillStyle = COLORS.zombie;
          ctx.globalAlpha = 0.3 + progress * 0.7;
          const h = Math.floor(32 * progress);
          ctx.fillRect(cx + 6, cy + 36 - h, 28, h);
          ctx.globalAlpha = 1;
        }
      }
    }

    if (!gameState.gameOver) {
      const px = (player.x - camX) * CELL;
      const py = player.y * CELL;
      const depthOffset = player.depth;
      ctx.fillStyle = COLORS.qb;
      ctx.fillRect(px + 4, py + 2 - depthOffset, 32, 36);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(px + 10, py + 8 - depthOffset, 6, 6);
      ctx.fillRect(px + 22, py + 8 - depthOffset, 6, 6);
      ctx.fillStyle = '#000000';
      ctx.fillRect(px + 12, py + 10 - depthOffset, 2, 2);
      ctx.fillRect(px + 24, py + 10 - depthOffset, 2, 2);
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(px + 28, py + 16 - depthOffset, 10, 8);
    } else {
      const px = (player.x - camX) * CELL;
      const py = player.y * CELL;
      ctx.fillStyle = '#4A2A0A';
      ctx.fillRect(px + 2, py + 2, 36, 36);
      ctx.fillStyle = '#3A1A0A';
      ctx.fillRect(px + 12, py + 4, 16, 2);
      ctx.fillRect(px + 16, py + 2, 8, 6);
      if (gameState.tick % 10 < 5) {
        ctx.fillStyle = '#FF0000';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME', px + 20, py + 22);
        ctx.fillText('OVER', px + 20, py + 32);
      }
    }

    if (gameState.touchdown && gameState.tick % 6 < 3) {
      ctx.fillStyle = '#FFD700';
      ctx.globalAlpha = 0.8;
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TOUCHDOWN!', VIEW_PX / 2, FIELD_H / 2);
      ctx.globalAlpha = 1;
    }

    if (gameState.sacked && !gameState.gameOver) {
      ctx.fillStyle = '#FF4444';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SACKED!', VIEW_PX / 2, FIELD_H / 2);
    }
  }

  drawHUD(score, timeSeconds, downsLabel, message) {
    const ctx = this.ctx;
    const hudY = FIELD_H;

    ctx.fillStyle = COLORS.hud;
    ctx.fillRect(0, hudY, VIEW_PX, HUD_H);

    ctx.fillStyle = '#333333';
    ctx.fillRect(0, hudY, VIEW_PX, 2);

    ctx.font = '14px monospace';
    ctx.textAlign = 'left';

    ctx.fillStyle = COLORS.hudLabel;
    ctx.fillText('TIME', 10, hudY + 20);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 20px monospace';
    ctx.fillText(String(timeSeconds), 70, hudY + 22);

    ctx.font = '14px monospace';
    ctx.fillStyle = COLORS.hudLabel;
    ctx.fillText('SCORE', 10, hudY + 45);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 20px monospace';
    ctx.fillText(String(score), 80, hudY + 47);

    ctx.font = '14px monospace';
    ctx.fillStyle = COLORS.hudLabel;
    ctx.fillText('DOWN', 180, hudY + 20);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 16px monospace';
    ctx.fillText(downsLabel, 240, hudY + 22);

    if (message) {
      ctx.fillStyle = '#FFD700';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(message, VIEW_PX / 2, hudY + 70);
      ctx.textAlign = 'left';
    }
  }

  drawStartScreen() {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, VIEW_PX, FIELD_H + HUD_H);

    ctx.fillStyle = '#FF8822';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VOODOO BOWL', VIEW_PX / 2, 100);

    ctx.fillStyle = '#4A7A2E';
    ctx.font = '18px monospace';
    ctx.fillText('MOBILE', VIEW_PX / 2, 135);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px monospace';
    ctx.fillText('Tap to Play', VIEW_PX / 2, 220);

    ctx.fillStyle = '#AAAAAA';
    ctx.font = '11px monospace';
    ctx.fillText('Swipe Up/Down to dodge', VIEW_PX / 2, 250);
    ctx.fillText('Swipe Right to sprint • Left to hesitate', VIEW_PX / 2, 268);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
