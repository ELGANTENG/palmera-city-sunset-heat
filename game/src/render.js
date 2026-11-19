// render.js — drawing only: the city, the cars, Lena, the police, the markers
// and the sun-soaked look. The camera follows the player; the world is drawn in
// world space, the HUD and menus in screen space. It never changes game state.
import { BEACH_Y, CAR_TYPES, COLORS, ROAD_W, ROAD_X, ROAD_Y, WATER_Y, WORLD_H, WORLD_W } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_MISSION = 'mission';

const FONT = "'Trebuchet MS', Verdana, sans-serif";

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const cam = { x: 0, y: 0, zoom: 1 };
  let time = 0;

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    cam.zoom = Math.max(0.7, Math.min(1.15, canvas.width / 1400));
  }
  window.addEventListener('resize', resize);
  resize();

  function text(value, x, y, size, color, align, bold) {
    ctx.font = (bold ? 'bold ' : '') + size + 'px ' + FONT;
    ctx.fillStyle = color;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(value, x, y);
  }

  function drawCarShape(x, y, angle, type, color, isPolice, headlights) {
    const spec = CAR_TYPES[type] || CAR_TYPES.sedan;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-spec.len / 2 + 3, -spec.wid / 2 + 4, spec.len, spec.wid);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-spec.len / 2, -spec.wid / 2, spec.len, spec.wid, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(20,30,50,0.85)';
    ctx.beginPath();
    ctx.roundRect(-spec.len / 6, -spec.wid / 2 + 4, spec.len / 3, spec.wid - 8, 4);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.fillRect(-spec.len / 2 + 4, -spec.wid / 2 - 2, 9, 4);
    ctx.fillRect(-spec.len / 2 + 4, spec.wid / 2 - 2, 9, 4);
    ctx.fillRect(spec.len / 2 - 13, -spec.wid / 2 - 2, 9, 4);
    ctx.fillRect(spec.len / 2 - 13, spec.wid / 2 - 2, 9, 4);
    if (isPolice) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(-4, -spec.wid / 2 + 2, 8, 5);
      ctx.fillStyle = time % 1 < 0.5 ? '#ff3b30' : '#2f7bff';
      ctx.beginPath(); ctx.arc(-6, -spec.wid / 2 + 4, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = time % 1 < 0.5 ? '#2f7bff' : '#ff3b30';
      ctx.beginPath(); ctx.arc(6, -spec.wid / 2 + 4, 4, 0, Math.PI * 2); ctx.fill();
    }
    if (headlights) {
      ctx.fillStyle = 'rgba(255,244,180,0.85)';
      ctx.beginPath(); ctx.arc(spec.len / 2, -spec.wid / 2 + 5, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(spec.len / 2, spec.wid / 2 - 5, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawWorld(city, state) {
    // Grass base, then the park, the beach and the sea.
    ctx.fillStyle = COLORS.grass;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.fillStyle = COLORS.park;
    ctx.fillRect(city.park.x, city.park.y, city.park.w, city.park.h);
    ctx.fillStyle = COLORS.sand;
    ctx.fillRect(0, BEACH_Y, WORLD_W, WORLD_H - BEACH_Y);
    ctx.fillStyle = COLORS.water;
    ctx.fillRect(0, WATER_Y, WORLD_W, WORLD_H - WATER_Y);
    ctx.fillStyle = COLORS.waterDeep;
    for (let i = 0; i < 8; i += 1) {
      ctx.fillRect(((i * 430 + time * 12) % (WORLD_W + 200)) - 100, WATER_Y + 24 + (i % 3) * 22, 130, 4);
    }
    // Pier.
    ctx.fillStyle = '#8a6b46';
    ctx.fillRect(city.pier.x - 16, BEACH_Y + 40, 32, WATER_Y - BEACH_Y - 10);
    // Roads with sidewalks and dashed centre lines.
    for (const rx of ROAD_X) {
      ctx.fillStyle = COLORS.sidewalk;
      ctx.fillRect(rx - ROAD_W / 2 - 10, 0, ROAD_W + 20, BEACH_Y);
      ctx.fillStyle = COLORS.road;
      ctx.fillRect(rx - ROAD_W / 2, 0, ROAD_W, BEACH_Y);
      ctx.fillStyle = COLORS.roadLine;
      for (let y = 20; y < BEACH_Y; y += 56) ctx.fillRect(rx - 3, y, 6, 28);
    }
    for (const ry of ROAD_Y) {
      ctx.fillStyle = COLORS.sidewalk;
      ctx.fillRect(0, ry - ROAD_W / 2 - 10, WORLD_W, ROAD_W + 20);
      ctx.fillStyle = COLORS.road;
      ctx.fillRect(0, ry - ROAD_W / 2, WORLD_W, ROAD_W);
      ctx.fillStyle = COLORS.roadLine;
      for (let x = 20; x < WORLD_W; x += 56) ctx.fillRect(x, ry - 3, 28, 6);
    }
    // Buildings with roofs and windows.
    for (const b of city.buildings) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(b.x + 5, b.y + 6, b.w, b.h);
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(b.x, b.y, b.w, 8);
      ctx.fillStyle = 'rgba(20,40,70,0.55)';
      const cols = Math.max(2, Math.floor(b.w / 34));
      const rows = Math.max(2, Math.floor(b.h / 34));
      for (let c = 0; c < cols; c += 1) for (let r = 0; r < rows; r += 1) {
        ctx.fillRect(b.x + 10 + c * ((b.w - 20) / cols), b.y + 12 + r * ((b.h - 20) / rows), 14, 12);
      }
      if (b.roof) { ctx.fillStyle = 'rgba(60,60,70,0.6)'; ctx.fillRect(b.x + b.w / 2 - 14, b.y + b.h / 2 - 10, 28, 20); }
    }
    // Trees and lamps.
    for (const t of city.trees) {
      ctx.fillStyle = '#2f7a34';
      ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#57b25e';
      ctx.beginPath(); ctx.arc(t.x - 4, t.y - 4, t.r * 0.55, 0, Math.PI * 2); ctx.fill();
    }
    for (const l of city.lamps) {
      ctx.fillStyle = '#3a3f4a';
      ctx.fillRect(l.x - 2, l.y - 2, 4, 4);
    }
    // Marina label.
    text('MARINA', city.marina.x, 210, 26, '#ffffff', 'center', true);
    text('PALMERA BEACH', 1700, BEACH_Y + 130, 30, '#7a5c2e', 'center', true);
  }

  function drawMarker(x, y, label, pulse) {
    const s = 1 + 0.18 * Math.sin(pulse * 5);
    ctx.save();
    ctx.translate(x, y - 26);
    ctx.scale(s, s);
    ctx.fillStyle = '#ffd23f';
    ctx.strokeStyle = '#7a5c00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -16); ctx.lineTo(13, 0); ctx.lineTo(0, 16); ctx.lineTo(-13, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7a5c00';
    ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    text(label, x, y + 34, 15, '#ffffff', 'center', true);
  }

  function drawPedestrian(p) {
    if (p.down > 0) {
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 12, 7, 0, 0, Math.PI * 2); ctx.fill();
      return;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(p.x + 2, p.y + 3, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y - 6, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(p.x - 6, p.y, 12, 14);
  }

  function drawPlayer(p) {
    if (p.inCar) return;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.invulnerable > 0 && Math.floor(p.invulnerable * 10) % 2 === 0) ctx.globalAlpha = 0.4;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(2, 4, 11, 7, 0, 0, Math.PI * 2); ctx.fill();
    // Lena: red jacket, dark hair.
    ctx.fillStyle = '#ff5a5a';
    ctx.fillRect(-8, -8, 16, 18);
    ctx.fillStyle = '#2b2b3a';
    ctx.beginPath(); ctx.arc(0, -14, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath(); ctx.arc(0, -15, 8, Math.PI, 0); ctx.fill();
    if (p.punchTimer > 0) {
      ctx.strokeStyle = '#ffd23f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(Math.cos(p.angle) * 20, Math.sin(p.angle) * 20, 10, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw(state, screen, ui) {
    time += 1 / 60;
    const p = state.player;
    const vw = canvas.width / cam.zoom;
    const vh = canvas.height / cam.zoom;
    cam.x = Math.max(0, Math.min(WORLD_W - vw, p.x - vw / 2));
    cam.y = Math.max(0, Math.min(WORLD_H - vh, p.y - vh / 2));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#ff9a5c');
    grad.addColorStop(0.55, '#ffb37a');
    grad.addColorStop(1, '#2b3a67');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(cam.zoom, 0, 0, cam.zoom, -cam.x * cam.zoom, -cam.y * cam.zoom);
    drawWorld(state.city, state);
    // Mission markers under the entities.
    for (const m of state.missions.markers) drawMarker(m.x, m.y, m.label, time);
    for (const c of state.traffic.cars) {
      const isGetaway = state.missions.markers.some((mk) => Math.hypot(mk.x - c.x, mk.y - c.y) < 40);
      drawCarShape(c.x, c.y, c.angle, c.type, c.color, false, false);
      if (isGetaway) drawMarker(c.x, c.y - 40, '', time);
    }
    for (const c of state.police.cruisers) drawCarShape(c.x, c.y, c.angle, 'police', '#1e6fd9', true, false);
    if (p.inCar) drawCarShape(p.x, p.y, p.angle, p.inCar.type, p.inCar.color, false, true);
    for (const ped of state.traffic.peds) drawPedestrian(ped);
    drawPlayer(p);
    // Off-screen mission marker arrow at the screen edge.
    if (state.missions.phase === 'active' && state.missions.markers.length > 0) {
      const m = state.missions.markers[0];
      const sx = (m.x - cam.x) * cam.zoom;
      const sy = (m.y - cam.y) * cam.zoom;
      if (sx < 0 || sx > canvas.width || sy < 0 || sy > canvas.height) {
        const cx = Math.max(60, Math.min(canvas.width - 60, sx));
        const cy = Math.max(80, Math.min(canvas.height - 80, sy));
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const ang = Math.atan2(sy - canvas.height / 2, sx - canvas.width / 2);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ang);
        ctx.fillStyle = '#ffd23f';
        ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-10, -12); ctx.lineTo(-10, 12); ctx.closePath(); ctx.fill();
        ctx.restore();
        const dist = Math.round(Math.hypot(m.x - p.x, m.y - p.y));
        text(dist + 'm', cx, cy + 34, 15, '#ffffff', 'center', true);
      }
    }
    return { cam, vw, vh };
  }

  return { draw, drawCarShape, text, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER, SCREEN_MISSION };
}
