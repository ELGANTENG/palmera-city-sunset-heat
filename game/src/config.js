// config.js — every tunable number and name for Palmera City: Sunset Heat.
// One job: hold the game's constants so the other files never hard-code magic numbers.
export const WORLD_W = 3400;
export const WORLD_H = 2600;
export const ROAD_W = 88;
export const BLOCK = 400;
// Vertical roads at these x centres, horizontal roads at these y centres.
export const ROAD_X = [140, 540, 940, 1340, 1740, 2140, 2540, 2940, 3300];
export const ROAD_Y = [120, 520, 920, 1320, 1720, 2120];
export const BEACH_Y = 2320; // sand starts here
export const WATER_Y = 2500; // sea starts here

export const COLORS = {
  grass: '#3f9e4d', grassDark: '#35873f', road: '#3a3f4a', roadLine: '#e8d44d',
  sidewalk: '#b9b3a4', sand: '#f2dd9e', water: '#2f7fc9', waterDeep: '#1f5fa8', park: '#2f8f3e',
};

export const CAR_TYPES = {
  sedan:  { name: 'Sedan',   maxSpeed: 330, accel: 250, turn: 2.6, color: '#c94f4f', len: 52, wid: 26 },
  coupe:  { name: 'Coupe',   maxSpeed: 400, accel: 300, turn: 3.0, color: '#4f7fd9', len: 50, wid: 24 },
  muscle: { name: 'Muscle',  maxSpeed: 470, accel: 340, turn: 2.5, color: '#e8a13c', len: 54, wid: 27 },
  van:    { name: 'Van',     maxSpeed: 290, accel: 210, turn: 2.2, color: '#7a8a99', len: 60, wid: 28 },
  taxi:   { name: 'Taxi',    maxSpeed: 350, accel: 260, turn: 2.7, color: '#f2c230', len: 52, wid: 26 },
  police: { name: 'Cruiser', maxSpeed: 430, accel: 330, turn: 3.1, color: '#1e6fd9', len: 54, wid: 27 },
};

export const MISSIONS = [
  { id: 1, name: 'The Getaway', intro: 'Lena needs a fast car. Take the marked getaway coupe to the Marina.', reward: 500 },
  { id: 2, name: 'Three Packages', intro: 'Pick up three packages across Palmera City. Watch the streets.', reward: 800 },
  { id: 3, name: 'Lose the Heat', intro: 'The cops are on you — 3 stars. Break their line of sight and lose them.', reward: 1200 },
  { id: 4, name: 'Sunset Delivery', intro: 'Deliver the cargo to the Pier before the timer runs out. Do not stop.', reward: 2000 },
];

export const SAVE_KEY = 'palmera-city-sunset-heat-save-v1';
export const PLAYER_START = { x: 940, y: 520 };
export const STEP = 1 / 60;
