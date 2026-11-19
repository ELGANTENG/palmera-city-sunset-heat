// world.js — the city itself: streets, buildings, the park, the beach and the pier.
// One job: build Palmera City once from a seed and answer collision questions about it.
// It holds no drawing and no game rules beyond what the ground is made of.
import { BEACH_Y, BLOCK, COLORS, ROAD_W, ROAD_X, ROAD_Y, WATER_Y, WORLD_H, WORLD_W } from './config.js';

const BUILDING_COLORS = ['#e8a34c', '#d96b6b', '#6b8fd9', '#9b6bd9', '#4cb8a0', '#e8d44d', '#c97ba8', '#8fb84f'];

function roadAt(x, roads) {
  for (const r of roads) if (Math.abs(x - r) < ROAD_W / 2) return true;
  return false;
}

export function createCity(random) {
  const buildings = [];
  const trees = [];
  const lamps = [];
  // The park block: columns 3-4, rows 2-3 of the grid (between roads 3 and 5).
  const park = { x: ROAD_X[3] + ROAD_W / 2 + 20, y: ROAD_Y[2] + ROAD_W / 2 + 20, w: 2 * BLOCK - ROAD_W - 40, h: 2 * BLOCK - ROAD_W - 40 };
  // Buildings fill every block cell except the park and the beach strip.
  for (let col = 0; col < ROAD_X.length - 1; col += 1) {
    for (let row = 0; row < ROAD_Y.length - 1; row += 1) {
      const x0 = ROAD_X[col] + ROAD_W / 2 + 14;
      const y0 = ROAD_Y[row] + ROAD_W / 2 + 14;
      const x1 = ROAD_X[col + 1] - ROAD_W / 2 - 14;
      const y1 = ROAD_Y[row + 1] - ROAD_W / 2 - 14;
      if (y0 > BEACH_Y) continue;
      const isPark = x0 >= park.x - 1 && y0 >= park.y - 1 && x1 <= park.x + park.w + 1 && y1 <= park.y + park.h + 1;
      if (isPark) {
        for (let t = 0; t < 14; t += 1) {
          trees.push({ x: x0 + 30 + random() * (x1 - x0 - 60), y: y0 + 30 + random() * (y1 - y0 - 60), r: 12 + random() * 10 });
        }
        continue;
      }
      const n = 1 + Math.floor(random() * 2);
      for (let b = 0; b < n; b += 1) {
        // Split the block cell into n horizontal strips so buildings never overlap.
        const stripY0 = y0 + (b * (y1 - y0)) / n;
        const stripY1 = y0 + ((b + 1) * (y1 - y0)) / n;
        const bw = 90 + random() * Math.min(110, x1 - x0 - 100);
        const bh = 70 + random() * Math.max(10, Math.min(90, stripY1 - stripY0 - 80));
        const bx = x0 + random() * Math.max(1, x1 - x0 - bw);
        const by = stripY0 + random() * Math.max(1, stripY1 - stripY0 - bh);
        buildings.push({
          x: Math.min(bx, x1 - bw), y: Math.min(by, stripY1 - bh), w: bw, h: bh,
          color: BUILDING_COLORS[Math.floor(random() * BUILDING_COLORS.length)],
          roof: random() < 0.3, label: random() < 0.4,
        });
      }
    }
  }
  // Street lamps along the roads.
  for (const rx of ROAD_X) for (const ry of ROAD_Y) lamps.push({ x: rx + ROAD_W / 2 + 6, y: ry + ROAD_W / 2 + 6 });
  // A few palm trees along the beach.
  for (let i = 0; i < 16; i += 1) trees.push({ x: 120 + i * 210 + random() * 60, y: BEACH_Y + 40 + random() * 60, r: 14, palm: true });

  const marina = { x: ROAD_X[7], y: ROAD_Y[0] - 40 };
  const pier = { x: 1740, y: WATER_Y - 30 };

  function onRoad(x, y) {
    return roadAt(x, ROAD_X) || roadAt(y, ROAD_Y);
  }
  function inWater(x, y) { return y > WATER_Y; }
  function onSand(x, y) { return y > BEACH_Y && y <= WATER_Y; }
  function buildingAt(x, y, pad) {
    for (const b of buildings) {
      if (x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad && y < b.y + b.h + pad) return b;
    }
    return null;
  }
  // Push a circle (x, y, radius) out of buildings and water; returns true if it hit anything.
  function collideCircle(p, radius) {
    let hit = false;
    const b = buildingAt(p.x, p.y, radius);
    if (b) {
      const cx = Math.max(b.x, Math.min(p.x, b.x + b.w));
      const cy = Math.max(b.y, Math.min(p.y, b.y + b.h));
      const dx = p.x - cx, dy = p.y - cy;
      const d = Math.hypot(dx, dy) || 1;
      if (d < radius) { p.x = cx + (dx / d) * radius; p.y = cy + (dy / d) * radius; hit = true; }
    }
    if (p.y > WATER_Y - radius) { p.y = WATER_Y - radius; hit = true; }
    p.x = Math.max(20, Math.min(WORLD_W - 20, p.x));
    p.y = Math.max(20, Math.min(WORLD_H - 20, p.y));
    return hit;
  }
  function randomRoadPoint() {
    if (random() < 0.5) return { x: ROAD_X[Math.floor(random() * ROAD_X.length)], y: 60 + random() * (BEACH_Y - 120) };
    return { x: 60 + random() * (WORLD_W - 120), y: ROAD_Y[Math.floor(random() * ROAD_Y.length)] };
  }
  function nearestRoadPoint(x, y) {
    let best = null, bestD = Infinity;
    for (const rx of ROAD_X) for (const ry of ROAD_Y) {
      const d = Math.hypot(rx - x, ry - y);
      if (d < bestD) { bestD = d; best = { x: rx, y: ry }; }
    }
    return best;
  }

  return { buildings, trees, lamps, park, marina, pier, onRoad, inWater, onSand, buildingAt, collideCircle, randomRoadPoint, nearestRoadPoint };
}
