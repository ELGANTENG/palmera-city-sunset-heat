// input.js — keyboard and pointer input. Held keys give movement and driving
// directions; one-shot presses (start, pause, enter car, punch) are queued as
// bit flags and taken once by the loop, so a press between frames is never lost.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_ENTER = 4;
export const ACTION_PUNCH = 8;
export const ACTION_MUTE = 16;
export const ACTION_NEW = 32;

const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
};

export function createInput(canvas) {
  const held = { up: false, down: false, left: false, right: false };
  let actions = 0;
  let mouse = { x: 0, y: 0, clicked: false };

  window.addEventListener('keydown', (event) => {
    const dir = KEYMAP[event.code];
    if (dir) { held[dir] = true; event.preventDefault(); return; }
    if (event.repeat) return;
    if (event.code === 'Space' || event.code === 'Enter') actions |= ACTION_CONFIRM;
    else if (event.code === 'KeyP' || event.code === 'Escape') actions |= ACTION_PAUSE;
    else if (event.code === 'KeyE') actions |= ACTION_ENTER;
    else if (event.code === 'KeyF') actions |= ACTION_PUNCH;
    else if (event.code === 'KeyM') actions |= ACTION_MUTE;
    else if (event.code === 'KeyN') actions |= ACTION_NEW;
    else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    const dir = KEYMAP[event.code];
    if (dir) held[dir] = false;
  });
  window.addEventListener('blur', () => {
    held.up = held.down = held.left = held.right = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse = { x: event.clientX - rect.left, y: event.clientY - rect.top, clicked: true };
    actions |= ACTION_CONFIRM;
  });

  return {
    held,
    takeActions() { const taken = actions; actions = 0; return taken; },
    takeMouse() { const m = mouse; mouse = { x: 0, y: 0, clicked: false }; return m; },
  };
}
