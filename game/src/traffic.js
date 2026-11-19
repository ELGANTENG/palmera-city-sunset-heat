// traffic.js — the city's moving life: traffic cars that follow the roads and
// pedestrians who stroll the sidewalks and scatter when a car comes at them.
// One job: keep the streets busy and answer "did the player hit anyone?".
import { CAR_TYPES, ROAD_W, ROAD_X, ROAD_Y } from './config.js';

const TRAFFIC_TYPES = ['sedan', 'coupe', 'van', 'taxi'];
const SKINS = ['#e8b13c', '#7ec8e3', '#d97b9b', '#9b8bd9', '#e3e3e3', '#5a6b7a'];

export function createTraffic(city, random) {
  const cars = [];
  const peds = [];
  let pedTimer = 0;

  function spawnCar(at, type, angle) {
    const p = at || city.randomRoadPoint();
    const t = type || TRAFFIC_TYPES[Math.floor(random() * TRAFFIC_TYPES.length)];
    const vertical = Math.abs(p.x - ROAD_X.reduce((a, b) => (Math.abs(b - p.x) < Math.abs(a - p.x) ? b : a))) < 10;
    const dir = random() < 0.5 ? 1 : -1;
    cars.push({
      x: p.x, y: p.y, type: t, angle: angle ?? (vertical ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? 0 : Math.PI)),
      speed: 90 + random() * 70, vertical, dir, parked: false, color: SKINS[Math.floor(random() * SKINS.length)],
      stolen: false, brake: 0,
    });
    return cars[cars.length - 1];
  }

  function spawnParked(at, type) {
    const p = at || city.randomRoadPoint();
    const t = type || TRAFFIC_TYPES[Math.floor(random() * TRAFFIC_TYPES.length)];
    const vertical = random() < 0.5;
    cars.push({
      x: p.x + (vertical ? 26 : 0), y: p.y + (vertical ? 0 : 26), type: t,
      angle: vertical ? (random() < 0.5 ? Math.PI / 2 : -Math.PI / 2) : (random() < 0.5 ? 0 : Math.PI),
      speed: 0, vertical, dir: 1, parked: true, color: SKINS[Math.floor(random() * SKINS.length)], stolen: false, brake: 0,
    });
    return cars[cars.length - 1];
  }

  function spawnPed(at) {
    const p = at || city.randomRoadPoint();
    peds.push({
      x: p.x + (random() - 0.5) * 40, y: p.y + (random() - 0.5) * 40,
      tx: p.x, ty: p.y, speed: 35 + random() * 30, panic: 0, down: 0,
      color: ['#ff8c42', '#6a4c93', '#1982c4', '#8ac926', '#e15a97'][Math.floor(random() * 5)],
    });
  }

  function seed() {
    cars.length = 0; peds.length = 0;
    for (let i = 0; i < 14; i += 1) spawnCar();
    for (let i = 0; i < 10; i += 1) spawnParked();
    for (let i = 0; i < 26; i += 1) spawnPed();
  }

  function nearestCar(x, y, maxDist) {
    let best = null, bestD = maxDist;
    for (const c of cars) {
      const d = Math.hypot(c.x - x, c.y - y);
      if (d < bestD) { bestD = d; best = c; }
    }
    return best;
  }

  function step(dt, playerObj, onPedHit) {
    const player = playerObj.state || playerObj;
    const hurt = (n) => { if (playerObj.damage) playerObj.damage(n); };
    // Traffic cars cruise their road; slow down when another car is ahead.
    for (const c of cars) {
      if (c.parked) continue;
      let ahead = false;
      for (const o of cars) {
        if (o === c || o.parked) continue;
        const dx = o.x - c.x, dy = o.y - c.y;
        const forward = c.vertical ? dy * c.dir : dx * c.dir;
        const side = c.vertical ? Math.abs(dx) : Math.abs(dy);
        if (forward > 0 && forward < 70 && side < 30) { ahead = true; break; }
      }
      const target = ahead ? 0 : (90 + (c.speed % 70));
      c.speed += Math.max(-220 * dt, Math.min(120 * dt, target - c.speed));
      const stepLen = c.speed * c.dir * dt;
      if (c.vertical) c.y += stepLen; else c.x += stepLen;
      // Wrap around the city edges so traffic never runs out.
      if (c.vertical && (c.y < 40 || c.y > 2320)) { c.y = c.dir > 0 ? 40 : 2320; c.x = ROAD_X[Math.floor(random() * ROAD_X.length)]; }
      if (!c.vertical && (c.x < 40 || c.x > 3360)) { c.x = c.dir > 0 ? 40 : 3360; c.y = ROAD_Y[Math.floor(random() * ROAD_Y.length)]; }
      // A traffic car that hits the player on foot knocks them down hard.
      if (!player.inCar && Math.hypot(c.x - player.x, c.y - player.y) < 34) {
        hurt(18);
        c.speed *= 0.4;
      }
    }
    // Pedestrians wander; panic and run from fast cars, and a hit car flattens them.
    pedTimer -= dt;
    if (pedTimer <= 0 && peds.length < 30) { spawnPed(); pedTimer = 1.5; }
    for (const p of peds) {
      if (p.down > 0) { p.down -= dt; continue; }
      const threat = player.inCar ? player : null;
      let fleeX = 0, fleeY = 0;
      if (threat && Math.abs(player.speed) > 60 && Math.hypot(p.x - player.x, p.y - player.y) < 150) {
        p.panic = 1.2;
        fleeX = (p.x - player.x) / 150; fleeY = (p.y - player.y) / 150;
      }
      if (p.panic > 0) p.panic -= dt;
      const dx = p.tx - p.x, dy = p.ty - p.y;
      const d = Math.hypot(dx, dy);
      if (d < 12) {
        const np = city.randomRoadPoint();
        p.tx = np.x; p.ty = np.y;
      } else {
        const sp = p.speed * (p.panic > 0 ? 3.2 : 1);
        p.x += ((dx / d) + fleeX * 2) * sp * dt;
        p.y += ((dy / d) + fleeY * 2) * sp * dt;
      }
      city.collideCircle(p, 10);
      if (player.inCar && Math.abs(player.speed) > 40 && Math.hypot(p.x - player.x, p.y - player.y) < 30) {
        p.down = 4;
        if (onPedHit) onPedHit(p);
      }
      if (!player.inCar && player.punchTimer > 0 && Math.hypot(p.x - player.x, p.y - player.y) < 46) {
        p.down = 3;
        p.x += Math.cos(player.angle) * 40; p.y += Math.sin(player.angle) * 40;
      }
    }
  }

  return { cars, peds, seed, spawnCar, spawnParked, spawnPed, nearestCar, step };
}
