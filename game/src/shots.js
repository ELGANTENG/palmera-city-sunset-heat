// shots.js — the screenshot scenes behind ?shot=start|drive|chase|mission.
// Each one plays the real rules forward from a fresh world for a fixed number
// of steps, steered by a simple autopilot (drive forward along the road, steer
// toward the mission marker), so the frame is what a short game really looks
// like and the same seed always gives the same frame.
import { STEP } from './config.js';

const DRIVE_SECONDS = 6;
const CHASE_SECONDS = 5;
const MISSION_SECONDS = 7;

function autopilotDrive(game, target) {
  const p = game.state.player;
  const dx = target.x - p.x, dy = target.y - p.y;
  const want = Math.atan2(dy, dx);
  let diff = want - p.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return {
    up: true, down: false,
    left: diff > 0.12, right: diff < -0.12,
  };
}

function runSteps(game, seconds, steer) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) game.step(STEP, steer ? steer(game) : { up: false, down: false, left: false, right: false });
}

/**
 * Set `game` to the named scene and return the screen to draw over it.
 * start: the title screen over a living city. drive: Lena speeding through
 * the city in a coupe. chase: a 3-star police chase. mission: job 2 in progress.
 */
export function stageShot(name, game) {
  game.startFresh();
  if (name === 'drive') {
    game.debugDrive();
    runSteps(game, DRIVE_SECONDS, (g) => autopilotDrive(g, { x: 2540, y: 520 }));
    return 'play';
  }
  if (name === 'chase') {
    game.debugChase();
    runSteps(game, CHASE_SECONDS, (g) => autopilotDrive(g, { x: 2540, y: 1720 }));
    return 'play';
  }
  if (name === 'mission') {
    game.debugMission();
    runSteps(game, MISSION_SECONDS, (g) => autopilotDrive(g, g.state.missions.markers[0] || { x: 1740, y: 920 }));
    return 'play';
  }
  game.debugTitleBackdrop();
  runSteps(game, 4, null);
  return 'title';
}
