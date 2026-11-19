// police.js — the wanted level and the Palmera City Police Department.
// One job: turn crimes into stars, chase the player with cruisers, ram them,
// try to arrest Lena on foot, and let the heat die down when she hides.
import { CAR_TYPES } from './config.js';

export function createPolice(city, random) {
  const cruisers = [];
  let wanted = 0;
  let hideTimer = 0;
  let decayTimer = 0;
  let arrestTimer = 0;
  let spawnTimer = 0;

  function addWanted(n) {
    wanted = Math.max(0, Math.min(5, wanted + n));
    if (wanted > 0) hideTimer = 0;
  }
  function setWanted(n) { wanted = Math.max(0, Math.min(5, n)); hideTimer = 0; }
  function clear() { wanted = 0; cruisers.length = 0; hideTimer = 0; arrestTimer = 0; }

  function spawnCruiser(player) {
    const edge = city.randomRoadPoint();
    const p = city.nearestRoadPoint(player.x, player.y);
    const sx = p.x + (random() < 0.5 ? -1 : 1) * (500 + random() * 300);
    const sy = p.y + (random() < 0.5 ? -1 : 1) * (400 + random() * 300);
    cruisers.push({
      x: Math.max(60, Math.min(3340, sx)), y: Math.max(60, Math.min(2280, sy)),
      type: 'police', angle: 0, speed: 0, color: '#1e6fd9', parked: false, stolen: false, brake: 0,
      ramCooldown: 0, siren: random(),
    });
    return cruisers[cruisers.length - 1];
  }

  function step(dt, playerObj, events) {
    const player = playerObj.state || playerObj;
    const hurt = (n) => { if (playerObj.damage) playerObj.damage(n); };
    // Keep the right number of cruisers on the street for the wanted level.
    const wantCount = wanted === 0 ? 0 : Math.min(5, 1 + wanted);
    spawnTimer -= dt;
    if (cruisers.length < wantCount && spawnTimer <= 0) { spawnCruiser(player); spawnTimer = 1.2; }
    if (cruisers.length > wantCount) cruisers.splice(wantCount);

    let nearest = Infinity;
    for (const c of cruisers) {
      const dx = player.x - c.x, dy = player.y - c.y;
      const dist = Math.hypot(dx, dy);
      nearest = Math.min(nearest, dist);
      const targetAngle = Math.atan2(dy, dx);
      let diff = targetAngle - c.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const spec = CAR_TYPES.police;
      const top = spec.maxSpeed * (0.85 + wanted * 0.05);
      c.speed = Math.min(top, c.speed + spec.accel * dt);
      c.angle += Math.max(-spec.turn * dt, Math.min(spec.turn * dt, diff * 2.2 * dt * 3));
      c.x += Math.cos(c.angle) * c.speed * dt;
      c.y += Math.sin(c.angle) * c.speed * dt;
      city.collideCircle(c, 16);
      if (c.ramCooldown > 0) c.ramCooldown -= dt;
      // Ram: contact with the player's car damages and slows them both.
      if (dist < 46 && c.ramCooldown <= 0) {
        c.ramCooldown = 0.8;
        if (player.inCar) {
          hurt(6);
          player.speed *= 0.55;
          events.crash = true;
        } else {
          hurt(12);
          events.crash = true;
        }
        c.speed *= 0.5;
      }
      // Arrest: a cruiser sitting on Lena on foot for a moment busts her.
      if (!player.inCar && dist < 42) {
        arrestTimer += dt;
        if (arrestTimer > 1.4) events.busted = true;
      }
    }
    if (nearest > 42) arrestTimer = Math.max(0, arrestTimer - dt * 2);

    // Wanted decays only when no cruiser can see her: none within 650 px.
    if (wanted > 0) {
      if (nearest > 650) {
        hideTimer += dt;
        decayTimer += dt;
        if (decayTimer > 4) { wanted -= 1; decayTimer = 0; if (wanted === 0) hideTimer = 0; }
      } else { hideTimer = 0; decayTimer = 0; }
    }
    return { wanted, hideTimer };
  }

  return { cruisers, addWanted, setWanted, clear, step, get wanted() { return wanted; } };
}
