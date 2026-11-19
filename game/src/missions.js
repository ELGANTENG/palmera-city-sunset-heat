// missions.js — Lena Cruz's story: four jobs across Palmera City.
// One job: track the active mission, its objectives and markers, and pay out
// when a job is done. It never draws anything — render.js reads its state.
import { MISSIONS } from './config.js';

export function createMissions(city, random) {
  let activeIndex = 0; // 0-based into MISSIONS; MISSIONS.length means the story is done
  let completed = 0;
  let phase = 'idle'; // idle | active | done
  let markers = []; // {x, y, label}
  let timer = 0;
  let message = '';
  let messageTimer = 0;
  let getawayCar = null;

  function objectiveText() {
    if (phase === 'done') return 'Story complete — free roam. Press E near a car and enjoy Palmera City.';
    if (phase !== 'active') return 'No active job. Walk to the yellow marker to start: ' + MISSIONS[activeIndex].name;
    const m = MISSIONS[activeIndex];
    if (m.id === 1) return markers.length > 1 ? 'Get in the getaway coupe, then drive to the Marina.' : 'Drive the getaway coupe to the Marina marker.';
    if (m.id === 2) return 'Collect the packages: ' + markers.length + ' left.';
    if (m.id === 3) return 'Lose the police! Stay out of sight until the heat dies down.';
    if (m.id === 4) return 'Deliver the cargo to the Pier before time runs out!';
    return m.intro;
  }

  function start(index, traffic, player) {
    activeIndex = index;
    phase = 'active';
    timer = 0;
    markers = [];
    const m = MISSIONS[index];
    if (m.id === 1) {
      getawayCar = traffic.spawnParked({ x: 1000, y: 520 }, 'coupe');
      getawayCar.color = '#e84c8a';
      markers.push({ x: getawayCar.x, y: getawayCar.y, label: 'Getaway car' });
    } else if (m.id === 2) {
      markers.push(
        { x: 1740, y: 920, label: 'Package 1' },
        { x: 540, y: 1720, label: 'Package 2' },
        { x: 2940, y: 1320, label: 'Package 3' },
      );
    } else if (m.id === 3) {
      timer = 75;
    } else if (m.id === 4) {
      timer = 95;
      markers.push({ x: city.pier.x, y: city.pier.y, label: 'Pier delivery' });
    }
    message = m.name + ': ' + m.intro;
    messageTimer = 5;
    return m;
  }

  function complete(player, onReward) {
    const m = MISSIONS[activeIndex];
    player.money += m.reward;
    completed += 1;
    phase = 'done';
    markers = [];
    message = 'Job complete: ' + m.name + ' — earned $' + m.reward + '!';
    messageTimer = 5;
    if (onReward) onReward(m);
    return m;
  }

  function update(dt, player, police, events) {
    if (messageTimer > 0) messageTimer -= dt;
    if (phase !== 'active') return null;
    const m = MISSIONS[activeIndex];
    if (m.id === 1) {
      if (player.inCar === getawayCar && markers.length > 1) {
        // already driving it — nothing to do until arrival
      } else if (player.inCar === getawayCar && markers.length === 1) {
        markers = [{ x: city.marina.x, y: city.marina.y, label: 'Marina' }];
      }
      if (markers.length === 1 && markers[0].label === 'Marina' && Math.hypot(player.x - markers[0].x, player.y - markers[0].y) < 90) {
        return complete(player, events.onReward);
      }
    } else if (m.id === 2) {
      for (let i = markers.length - 1; i >= 0; i -= 1) {
        if (Math.hypot(player.x - markers[i].x, player.y - markers[i].y) < 55) {
          markers.splice(i, 1);
          events.pickup = true;
          player.money += 50;
        }
      }
      if (markers.length === 0) return complete(player, events.onReward);
    } else if (m.id === 3) {
      timer -= dt;
      if (police.wanted === 0) return complete(player, events.onReward);
      if (timer <= 0) { phase = 'idle'; message = 'The heat never died down — job failed. Try again.'; messageTimer = 5; return 'failed'; }
    } else if (m.id === 4) {
      timer -= dt;
      if (Math.hypot(player.x - city.pier.x, player.y - city.pier.y) < 90) return complete(player, events.onReward);
      if (timer <= 0) { phase = 'idle'; message = 'Out of time — the cargo missed its boat. Try again.'; messageTimer = 5; return 'failed'; }
    }
    return null;
  }

  function nextAvailable() { return activeIndex < MISSIONS.length; }

  // Back to waiting for the next job (used when a run restarts or a job is done).
  function resetToIdle() {
    phase = 'idle';
    markers = [];
    timer = 0;
    message = '';
    messageTimer = 0;
  }

  // Move on to the next job after one is completed.
  function advance() {
    activeIndex = Math.min(MISSIONS.length, activeIndex + 1);
    resetToIdle();
  }

  return {
    get activeIndex() { return activeIndex; },
    get completed() { return completed; },
    get phase() { return phase; },
    get markers() { return markers; },
    get timer() { return timer; },
    get message() { return message; },
    get messageTimer() { return messageTimer; },
    objectiveText, start, complete, update, nextAvailable, resetToIdle, advance,
    setCompleted(n) { completed = n; },
    setActiveIndex(n) { activeIndex = n; },
  };
}
