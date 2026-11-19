// player.js — Lena Cruz on foot and behind the wheel.
// One job: move the player, drive a car, punch, and take damage. It knows nothing
// about missions, police or the HUD — those systems read what it exposes.
import { CAR_TYPES, PLAYER_START } from './config.js';

export const WALK_SPEED = 185;

export function createPlayer() {
  const state = {
    x: PLAYER_START.x, y: PLAYER_START.y, angle: -Math.PI / 2,
    health: 100, money: 0, inCar: null, speed: 0,
    punchTimer: 0, punchCooldown: 0, invulnerable: 0, dead: false,
  };

  function reset() {
    state.x = PLAYER_START.x; state.y = PLAYER_START.y; state.angle = -Math.PI / 2;
    state.health = 100; state.inCar = null; state.speed = 0;
    state.punchTimer = 0; state.punchCooldown = 0; state.invulnerable = 0; state.dead = false;
  }

  function damage(amount) {
    if (state.invulnerable > 0 || state.dead) return;
    state.health -= amount;
    state.invulnerable = 0.6;
    if (state.health <= 0) { state.health = 0; state.dead = true; }
  }

  function heal(amount) { state.health = Math.min(100, state.health + amount); }

  // On foot: WASD moves Lena; F starts a punch swing.
  function walk(dt, held, punch, city) {
    let dx = (held.right ? 1 : 0) - (held.left ? 1 : 0);
    let dy = (held.down ? 1 : 0) - (held.up ? 1 : 0);
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      dx /= len; dy /= len;
      state.x += dx * WALK_SPEED * dt;
      state.y += dy * WALK_SPEED * dt;
      state.angle = Math.atan2(dy, dx);
    }
    city.collideCircle(state, 14);
    if (state.punchCooldown > 0) state.punchCooldown -= dt;
    if (state.punchTimer > 0) state.punchTimer -= dt;
    if (punch && state.punchCooldown <= 0) {
      state.punchTimer = 0.25;
      state.punchCooldown = 0.45;
      return true;
    }
    return false;
  }

  // Driving: W accelerates, S brakes/reverses, A/D steer (steering flips in reverse).
  function drive(dt, held, car) {
    const spec = CAR_TYPES[car.type];
    const forward = held.up ? 1 : 0;
    const back = held.down ? 1 : 0;
    if (forward) state.speed += spec.accel * dt;
    else if (back) state.speed -= (state.speed > 0 ? spec.accel * 1.4 : spec.accel * 0.6) * dt;
    else state.speed -= state.speed * 0.9 * dt;
    state.speed = Math.max(-spec.maxSpeed * 0.45, Math.min(spec.maxSpeed, state.speed));
    if (Math.abs(state.speed) > 4) {
      const steer = ((held.left ? 1 : 0) - (held.right ? 1 : 0)) * spec.turn * (state.speed >= 0 ? 1 : -1);
      state.angle += steer * dt * Math.min(1, Math.abs(state.speed) / 120);
    }
    car.x = state.x; car.y = state.y; car.angle = state.angle; car.speed = state.speed;
  }

  function syncFromCar(car) {
    state.x = car.x; state.y = car.y; state.angle = car.angle; state.speed = car.speed;
  }

  return { state, reset, damage, heal, walk, drive, syncFromCar };
}
