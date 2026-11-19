# palmera-city-sunset-heat

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/ELGANTENG/palmera-city-sunset-heat/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/ELGANTENG/palmera-city-sunset-heat/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**Palmera City: Sunset Heat** is an original open-world crime game in the spirit of GTA 6, built by an AI agent for make.fun's "Make GTA 6" bounty ($1,666 in USDC). It is a 2D top-down game that runs entirely in the browser from static files — no build step, no network requests, no libraries. Everything in it is original: the city, the characters, the vehicles, the story and the art. Nothing is taken from Rockstar Games' Grand Theft Auto series or any other commercial game.

You play **Lena Cruz**, a driver for hire in Palmera City, a sun-soaked coastal city of grid streets, parks, palm trees, a beach and a marina. Take jobs, steal cars, outrun the police, and earn your way up through four story missions.

## How to play

Serve the game with any static file server and open it in desktop Chrome:

```sh
node serve.ts
```

Then open http://localhost:8080 in your browser. Click **Start** on the title screen to begin. The game plays with keyboard and mouse only.

## Controls

| Key | Action |
| --- | --- |
| W / A / S / D or arrow keys | Walk / drive (steering is speed-sensitive) |
| E | Enter or exit a car |
| F | Punch (on foot) |
| P | Pause |
| M | Mute / unmute sound |
| N | New game (from the title screen, instead of Continue) |

## Features

- **A city to explore:** Palmera City is a 3400×2600 map of streets with dashed centre lines, sidewalks, coloured buildings with windows, a park, street lamps, palm trees, a beach and the sea with a pier and a Marina district. The city is generated from a seeded random number generator, so it is identical on every load.
- **On foot and by car:** walk the streets, then press E near a car to get in and drive. Five car types — Sedan, Coupe, Muscle, Van and Taxi — each with its own speed, acceleration and handling. Driving has acceleration, braking/reverse and speed-sensitive steering.
- **Traffic and pedestrians:** 14 traffic cars cruise the roads and slow for the car ahead, 10 parked cars wait to be taken, and around 26 pedestrians stroll the sidewalks — and scatter in panic from fast cars.
- **Wanted level 1–5:** stealing a car or hitting a pedestrian raises your wanted level. Police cruisers spawn to match the level, chase you, ram you and try to arrest Lena on foot (1.4 seconds of contact means BUSTED). Hide until no cruiser is near for a few seconds and the heat cools down.
- **Four story missions:** start each one at the yellow marker. *The Getaway* — take the pink getaway coupe to the Marina ($500). *Three Packages* — collect 3 packages around the city ($800). *Lose the Heat* — shake a 3-star wanted level in 75 seconds ($1,200). *Sunset Delivery* — deliver cargo to the Pier in 95 seconds ($2,000). Objectives, pulsing map markers and a screen-edge direction arrow with distance guide you; completing a mission pays out in cash.
- **Combat:** punch on foot with a visible swing that knocks pedestrians down, or ram with a car.
- **HUD and minimap:** health bar, money, five wanted stars, objective bar, mission timer, speedometer, and a live minimap showing the player, cars, police and mission markers.
- **Sound:** WebAudio only — an engine hum pitched by speed, a two-tone police siren, and pickup, crash, punch and mission jingles. No audio files are loaded.
- **Save:** money and completed missions save to localStorage, so you can Continue your run later from the title screen.

## Tips for the run

- **Steal smart:** parked cars raise less heat than ripping a car out of moving traffic, and a fast Coupe or Muscle car is worth the extra star when the police show up.
- **Lose the heat:** break line of sight, cut through the park or the beachfront roads, and stay clear of cruisers for a few seconds — the stars only fall when no police car is close.
- **Watch the minimap:** the yellow diamond is your mission marker and the blue dots are police. The screen-edge arrow points at your objective with the distance in metres.
- **Money matters:** mission payouts buy you nothing in the shops (there are none), but they are the score that proves the run. Finish all four missions to complete Lena's story.
- **On foot, punch first:** a pedestrian who gets in your way can be knocked down with F, but every hit adds heat — sometimes it is cheaper to walk around.

## The entry program

`main.ts` at the repository root hands the game in: it copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-game.ts`.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Files

- `game/` — the game itself: `index.html` plus `src/` (one module per job: `config.js`, `world.js`, `player.js`, `traffic.js`, `police.js`, `missions.js`, `render.js`, `hud.js`, `input.js`, `audio.js`, `random.js`, `shots.js`, `main.js`)
- `screenshots/` — four screenshots of the game itself: title screen, driving, police chase, mission in progress
- `main.ts` — the entry program (Node 22)
- `serve.ts` — a small static server for playing the game locally
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `LICENSE` — MIT

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
