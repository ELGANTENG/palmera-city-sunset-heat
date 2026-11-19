// hud.js — everything drawn in screen space: the HUD (health, money, wanted
// stars, speed, objective), the minimap, and the menu screens. One job: tell
// the player what is happening and where to go next.
import { BEACH_Y, MISSIONS, WORLD_H, WORLD_W } from './config.js';

const FONT = "'Trebuchet MS', Verdana, sans-serif";

export function createHud(canvas) {
  const ctx = canvas.getContext('2d');

  function text(value, x, y, size, color, align, bold) {
    ctx.font = (bold ? 'bold ' : '') + size + 'px ' + FONT;
    ctx.fillStyle = color;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(value, x, y);
  }

  function panel(x, y, w, h, alpha) {
    ctx.fillStyle = 'rgba(10,14,30,' + (alpha ?? 0.55) + ')';
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawHud(state, screen) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const p = state.player;
    const W = canvas.width, H = canvas.height;
    // Top-left: health + money.
    panel(16, 14, 250, 64, 0.6);
    text('LENA CRUZ', 30, 38, 16, '#ffffff', 'left', true);
    ctx.fillStyle = '#333';
    ctx.fillRect(30, 46, 180, 12);
    ctx.fillStyle = p.health > 50 ? '#4caf50' : p.health > 25 ? '#ff9800' : '#f44336';
    ctx.fillRect(30, 46, Math.max(0, 180 * p.health / 100), 12);
    text('$' + p.money, 222, 60, 18, '#7dff8a', 'left', true);
    // Top-right: wanted stars.
    panel(W - 216, 14, 200, 48, 0.6);
    text('WANTED', W - 202, 34, 13, '#ffb3b3', 'left', true);
    for (let i = 0; i < 5; i += 1) {
      ctx.fillStyle = i < state.police.wanted ? '#ffd23f' : 'rgba(255,255,255,0.25)';
      const sx = W - 196 + i * 30, sy = 50;
      ctx.beginPath();
      for (let k = 0; k < 5; k += 1) {
        const a = -Math.PI / 2 + (k * 4 * Math.PI) / 5;
        const px = sx + Math.cos(a) * 10, py = sy + Math.sin(a) * 10;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
    }
    // Top-centre: mission objective.
    const obj = state.missions.objectiveText();
    const ow = Math.min(W - 520, 640);
    panel((W - ow) / 2, 14, ow, 44, 0.6);
    text('★ ' + obj, W / 2, 42, 16, '#ffe9a8', 'center', true);
    // Mission timer, if one is running.
    if (state.missions.phase === 'active' && state.missions.timer > 0) {
      text(Math.ceil(state.missions.timer) + 's', W / 2, 84, 26, state.missions.timer < 20 ? '#ff6b6b' : '#ffffff', 'center', true);
    }
    // Bottom-left: speed when driving, controls hint on foot.
    if (p.inCar) {
      panel(16, H - 76, 190, 60, 0.6);
      text(Math.round(Math.abs(p.speed) * 0.36) + ' km/h', 30, H - 40, 26, '#ffffff', 'left', true);
      text(p.inCar.type.toUpperCase(), 30, H - 22, 13, '#9fd0ff', 'left', true);
    } else {
      panel(16, H - 76, 250, 60, 0.6);
      text('WASD walk · E enter car', 30, H - 44, 15, '#ffffff', 'left', true);
      text('F punch · P pause · M mute', 30, H - 24, 15, '#cdd6ff', 'left', true);
    }
    // Mission flash message.
    if (state.missions.messageTimer > 0) {
      panel((W - 620) / 2, H - 150, 620, 52, 0.75);
      text(state.missions.message, W / 2, H - 116, 17, '#ffffff', 'center', true);
    }
    drawMinimap(state);
  }

  function drawMinimap(state) {
    const W = canvas.width, H = canvas.height;
    const mw = 210, mh = 160;
    const x0 = W - mw - 16, y0 = H - mh - 16;
    const sx = mw / WORLD_W, sy = mh / WORLD_H;
    panel(x0 - 6, y0 - 6, mw + 12, mh + 12, 0.65);
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, y0, mw, mh); ctx.clip();
    ctx.fillStyle = '#2f7a34';
    ctx.fillRect(x0, y0, mw, mh);
    ctx.fillStyle = '#3a3f4a';
    for (const rx of [140, 540, 940, 1340, 1740, 2140, 2540, 2940, 3300]) ctx.fillRect(x0 + rx * sx - 2, y0, 4, mh);
    for (const ry of [120, 520, 920, 1320, 1720, 2120]) ctx.fillRect(x0, y0 + ry * sy - 2, mw, 4);
    ctx.fillStyle = '#2f7fc9';
    ctx.fillRect(x0, y0 + BEACH_Y * sy, mw, mh - BEACH_Y * sy);
    const p = state.player;
    for (const m of state.missions.markers) {
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath(); ctx.arc(x0 + m.x * sx, y0 + m.y * sy, 5, 0, Math.PI * 2); ctx.fill();
    }
    for (const c of state.traffic.cars) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x0 + c.x * sx - 2, y0 + c.y * sy - 2, 4, 4);
    }
    for (const c of state.police.cruisers) {
      ctx.fillStyle = '#2f7bff';
      ctx.beginPath(); ctx.arc(x0 + c.x * sx, y0 + c.y * sy, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = p.inCar ? '#ff5a5a' : '#ffffff';
    ctx.beginPath(); ctx.arc(x0 + p.x * sx, y0 + p.y * sy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    text('PALMERA CITY', x0 + mw / 2, y0 - 12, 12, '#ffffff', 'center', true);
  }

  function drawMenuScreen(title, lines, prompt, accent) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = 'rgba(8,10,28,0.72)';
    ctx.fillRect(0, 0, W, H);
    const pw = Math.min(720, W - 80);
    const ph = 150 + lines.length * 34;
    const px = (W - pw) / 2, py = (H - ph) / 2;
    ctx.fillStyle = 'rgba(16,20,44,0.95)';
    ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 16); ctx.fill();
    ctx.strokeStyle = accent || '#ff9a5c';
    ctx.lineWidth = 3;
    ctx.stroke();
    text(title, W / 2, py + 74, 44, '#ffffff', 'center', true);
    for (let i = 0; i < lines.length; i += 1) text(lines[i], W / 2, py + 128 + i * 34, 19, '#dfe6ff', 'center', false);
    text(prompt, W / 2, py + ph - 28, 20, '#ffd23f', 'center', true);
  }

  function drawTitle(state, save) {
    const lines = [
      'Sun-soaked Palmera City. One driver. Four jobs. Five stars of trouble.',
      'Lena Cruz owes the Marina crew $2,000 — and the city is about to pay her back.',
      'WASD / arrows — walk & drive · E — enter / steal a car · F — punch',
      'P — pause · M — mute · Your money and jobs save automatically.',
    ];
    if (save) lines.push('Saved progress found: $' + save.money + ' · ' + save.missionsCompleted + ' job(s) done — press Enter to continue it.');
    drawMenuScreen('PALMERA CITY', lines, save ? 'Press Space to start fresh, or Enter to Continue' : 'Press Space or click to start', '#ff9a5c');
    text('SUNSET HEAT', canvas.width / 2, (canvas.height / 2) - 120, 26, '#ffd23f', 'center', true);
  }

  function drawPaused() {
    drawMenuScreen('PAUSED', ['The city waits for you.'], 'Press P to resume · M to mute', '#7ec8e3');
  }

  function drawOver(state, reason) {
    const lines = [
      reason === 'busted' ? 'The Palmera City police caught Lena. The crew will post bail — for a price.' : 'Lena is down. The city keeps moving without her.',
      'Money kept: $' + state.player.money + ' · Jobs done: ' + state.missions.completed + ' of ' + MISSIONS.length,
    ];
    drawMenuScreen(reason === 'busted' ? 'BUSTED' : 'WASTED', lines, 'Press Space to try again', '#ff5a5a');
  }

  function drawMissionComplete(mission, money) {
    drawMenuScreen('JOB COMPLETE', [
      mission.name + ' — done.',
      'Reward: $' + mission.reward + ' · Total money: $' + money,
      'Next job: ' + (mission.id < MISSIONS.length ? MISSIONS[mission.id].name : 'Free roam — the city is yours.'),
    ], 'Press Space to keep playing', '#7dff8a');
  }

  return { drawHud, drawTitle, drawPaused, drawOver, drawMissionComplete };
}
