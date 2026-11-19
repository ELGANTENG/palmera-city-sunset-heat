// main.js — boot and the one loop: input every frame, the world in fixed 1/60 s
// steps, and the renderer painting what is there. The game moves between five
// screens: title, play, paused, mission-complete and game over.
// ?shot=start|drive|chase|mission stages that scene instead of running the
// loop, paints it and sets window.__shotReady for a screenshot.
import { MISSIONS, SAVE_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createCity } from './world.js';
import { ACTION_CONFIRM, ACTION_ENTER, ACTION_MUTE, ACTION_NEW, ACTION_PAUSE, ACTION_PUNCH, createInput } from './input.js';
import { createPlayer } from './player.js';
import { createTraffic } from './traffic.js';
import { createPolice } from './police.js';
import { createMissions } from './missions.js';
import { createRenderer } from './render.js';
import { createHud } from './hud.js';
import { createAudio } from './audio.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const START_MARKER = { x: 940, y: 640, label: 'Start job' };

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 20261119;

function readSave() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (typeof s.money !== 'number') return null;
    return s;
  } catch { return null; }
}

function writeSave(game) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify({
      money: game.state.player.money,
      missionsCompleted: game.state.missions.completed,
      activeIndex: game.state.missions.activeIndex,
    }));
  } catch { /* storage can be off: progress then lasts this visit only */ }
}

export function createGame(canvas, statusEl) {
  const random = createRandom(seed);
  const city = createCity(random);
  const player = createPlayer();
  const traffic = createTraffic(city, random);
  const police = createPolice(city, random);
  const missions = createMissions(city, random);
  const audio = createAudio();
  const renderer = createRenderer(canvas);
  const hud = createHud(canvas);
  const input = createInput(canvas);

  const state = { city, player: player.state, traffic, police, missions };
  let screen = 'title';
  let overReason = 'wasted';
  let lastMission = null;
  let save = readSave();

  function announce(message) { if (statusEl) statusEl.textContent = message; }

  function resetWorld() {
    player.reset();
    traffic.seed();
    police.clear();
    missions.setActiveIndex(save ? save.activeIndex : 0);
    missions.setCompleted(save ? save.missionsCompleted : 0);
    missions.resetToIdle();
    player.state.money = save ? save.money : 0;
  }

  function startFresh() {
    save = null;
    resetWorld();
    screen = 'play';
    announce('Playing. First job: ' + MISSIONS[missions.activeIndex].name);
  }

  function continueSave() {
    resetWorld();
    screen = 'play';
    announce('Continuing. Money $' + player.state.money + '.');
  }

  function ensureStartMarker() {
    if (missions.phase !== 'idle' || !missions.nextAvailable()) return;
    if (!missions.markers.some((m) => m.label.startsWith('Start'))) {
      missions.markers.push({ x: START_MARKER.x, y: START_MARKER.y, label: 'Start: ' + MISSIONS[missions.activeIndex].name });
    }
  }

  function tryStartMission() {
    if (missions.phase !== 'idle' || !missions.nextAvailable()) return;
    const marker = missions.markers.find((m) => m.label.startsWith('Start'));
    if (marker && Math.hypot(player.state.x - marker.x, player.state.y - marker.y) < 70) {
      missions.markers.length = 0;
      const m = missions.start(missions.activeIndex, traffic, player.state);
      if (m.id === 3) police.setWanted(3);
      audio.mission();
      announce('Mission started: ' + m.name);
    }
  }

  function enterOrExitCar() {
    const p = player.state;
    if (p.inCar) {
      const car = p.inCar;
      p.inCar = null;
      p.speed = 0;
      car.parked = true;
      car.speed = 0;
      p.x += Math.cos(p.angle + Math.PI / 2) * 30;
      p.y += Math.sin(p.angle + Math.PI / 2) * 30;
      city.collideCircle(p, 14);
      return;
    }
    const car = traffic.nearestCar(p.x, p.y, 75);
    if (!car || car.type === 'police') return;
    p.inCar = car;
    car.parked = true;
    car.speed = 0;
    player.syncFromCar(car);
    if (!car.stolen) {
      car.stolen = true;
      police.addWanted(1);
      announce('Car stolen! Wanted level rose.');
    }
    audio.pickup();
  }

  function carCollisions(events) {
    const p = player.state;
    if (!p.inCar) return;
    for (const c of traffic.cars) {
      if (c === p.inCar || c.parked) continue;
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (d < 44 && Math.abs(p.speed) > 60) {
        p.speed *= 0.5;
        c.speed *= 0.4;
        player.damage(4);
        events.crash = true;
      } else if (d < 40) {
        const push = (44 - d) / 2;
        const nx = (p.x - c.x) / (d || 1), ny = (p.y - c.y) / (d || 1);
        p.x += nx * push; p.y += ny * push;
      }
    }
  }

  // One fixed simulation step. `held` is the input's held-key state.
  function step(dt, held) {
    const p = player.state;
    if (p.invulnerable > 0) p.invulnerable -= dt;
    const events = { crash: false, busted: false, pickup: false, onReward: null };

    if (p.inCar) {
      const before = { x: p.x, y: p.y };
      player.drive(dt, held, p.inCar);
      if (city.collideCircle(p, 18)) {
        if (Math.abs(p.speed) > 120) { player.damage(5); events.crash = true; }
        p.speed *= 0.45;
        p.inCar.x = p.x; p.inCar.y = p.y;
      }
      carCollisions(events);
    } else {
      const punched = player.walk(dt, held, false, city);
      if (punched) audio.punch();
    }

    traffic.step(dt, player, () => {
      police.addWanted(1);
      events.crash = true;
      announce('Pedestrian hit! Wanted level rose.');
    });
    const policeState = police.step(dt, player, events);
    if (events.busted) { endGame('busted'); return; }
    if (p.dead) { endGame('wasted'); return; }

    ensureStartMarker();
    tryStartMission();
    const result = missions.update(dt, p, police, events);
    if (result && result !== 'failed') {
      lastMission = result;
      screen = 'mission';
      writeSave({ state });
      audio.mission();
      announce('Job complete: ' + result.name);
    } else if (result === 'failed') {
      writeSave({ state });
    }
    if (events.crash) audio.crash();
    if (events.pickup) audio.pickup();

    audio.engine(p.inCar ? Math.abs(p.speed) : 0, p.inCar ? 470 : 1, !!p.inCar);
    audio.siren(dt, policeState.wanted);
  }

  function endGame(reason) {
    overReason = reason;
    screen = 'over';
    writeSave({ state });
    audio.busted();
    announce(reason === 'busted' ? 'Busted by the police.' : 'Wasted.');
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) { const m = audio.toggleMute(); announce(m ? 'Muted.' : 'Sound on.'); }
    if (screen === 'title') {
      if (actions & ACTION_NEW) startFresh();
      else if (actions & ACTION_CONFIRM) { audio.unlock(); if (save) continueSave(); else startFresh(); }
      return;
    }
    if (screen === 'mission') {
      if (actions & ACTION_CONFIRM) {
        screen = 'play';
        if (missions.phase === 'done') missions.advance();
      }
      return;
    }
    if (screen === 'over') {
      if (actions & ACTION_CONFIRM) startFresh();
      return;
    }
    if (actions & ACTION_PAUSE) {
      if (screen === 'play') { screen = 'paused'; announce('Paused.'); }
      else if (screen === 'paused') { screen = 'play'; announce('Playing.'); }
      return;
    }
    if (screen !== 'play') return;
    if (actions & ACTION_ENTER) enterOrExitCar();
    if (actions & ACTION_PUNCH) {
      const p = player.state;
      if (!p.inCar && p.punchCooldown <= 0) {
        p.punchTimer = 0.25; p.punchCooldown = 0.45;
        audio.punch();
      }
    }
  }

  // Debug helpers used by shots.js to stage screenshot scenes.
  function debugDrive() {
    const car = traffic.spawnParked({ x: 940, y: 520 }, 'coupe');
    // Clear the whole east-west road ahead so the drive shot shows clean driving.
    for (let i = traffic.cars.length - 1; i >= 0; i -= 1) {
      const c = traffic.cars[i];
      if (c !== car && Math.abs(c.y - 520) < 70) traffic.cars.splice(i, 1);
    }
    player.state.x = car.x; player.state.y = car.y; player.state.angle = 0;
    player.state.inCar = car;
    car.parked = true;
  }
  function debugChase() {
    debugDrive();
    const p = player.state;
    p.inCar = traffic.spawnParked({ x: 1340, y: 920 }, 'muscle');
    p.inCar.parked = true;
    p.x = p.inCar.x; p.y = p.inCar.y; p.angle = 0;
    police.setWanted(3);
  }
  function debugMission() {
    missions.start(1, traffic, player.state);
    const car = traffic.spawnParked({ x: 1740, y: 1100 }, 'sedan');
    player.state.x = car.x; player.state.y = car.y; player.state.angle = -Math.PI / 2;
    player.state.inCar = car;
    car.parked = true;
  }
  function debugTitleBackdrop() {
    traffic.seed();
  }

  const game = {
    state, step, startFresh, continueSave, debugDrive, debugChase, debugMission, debugTitleBackdrop,
    get screen() { return screen; },
    set screen(v) { screen = v; },
    get save() { return save; },
    get lastMission() { return lastMission; },
  };

  function runShot(name) {
    const shotScreen = stageShot(name, game);
    screen = shotScreen;
    let painted = 0;
    function paint() {
      renderer.draw(state, screen, {});
      if (screen === 'play') hud.drawHud(state, screen);
      else if (screen === 'title') hud.drawTitle(state, game.save);
      painted += 1;
      if (painted < 2) requestAnimationFrame(paint);
      else window.__shotReady = true;
    }
    requestAnimationFrame(paint);
  }

  function runGame() {
    resetWorld();
    let accumulator = 0;
    let last = performance.now();
    function frame(now) {
      requestAnimationFrame(frame);
      accumulator += Math.min((now - last) / 1000, MAX_FRAME);
      last = now;
      handleActions();
      if (screen === 'play') {
        while (accumulator >= STEP) { step(STEP, input.held); accumulator -= STEP; }
      } else accumulator = 0;
      renderer.draw(state, screen, {});
      if (screen === 'play') hud.drawHud(state, screen);
      else if (screen === 'title') hud.drawTitle(state, save);
      else if (screen === 'paused') { hud.drawHud(state, screen); hud.drawPaused(); }
      else if (screen === 'over') hud.drawOver(state, overReason);
      else if (screen === 'mission' && lastMission) hud.drawMissionComplete(lastMission, player.state.money);
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && screen === 'play') { screen = 'paused'; announce('Paused.'); }
    });
    announce('Palmera City: Sunset Heat. Press Space or click to start.');
    requestAnimationFrame(frame);
  }

  return { game, runShot, runGame };
}

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const { game, runShot, runGame } = createGame(canvas, statusEl);
if (shot) runShot(shot);
else runGame();
