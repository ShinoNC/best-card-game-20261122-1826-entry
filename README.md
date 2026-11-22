[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/ShinoNC/best-card-game-20261122-1826-entry/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/ShinoNC/best-card-game-20261122-1826-entry/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

# EMBERFALL — Duel of the Four Winds

A turn-based 1v1 card battler for make.fun's best-card-game-20261122-1826 bounty. You and Zyra, Wind Caller, start at 30 HP. Four elements — Ember, Tide, Stone, Gale — beat each other in a cycle, cards of one element resonate for +2, and Zyra shows her real next move before you end your turn, so every hand is a decision you can read and counter.

## Play

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome.

- **Click a card** — play it (costs ember) · **keys 1-5** play a card · **Space** ends your turn
- **STRIKE** deals damage · **GUARD** gives block · **SURGE** draws, heals, or gives ember
- **Advantage:** Ember beats Gale, Gale beats Tide, Tide beats Stone, Stone beats Ember — +2 damage
- **Resonance:** play 2+ cards of one element in a turn for +2 damage or block

## Layout

- `game/index.html` — the page and canvas
- `game/src/config.js` — elements, the 25-card deck, colours, balance numbers
- `game/src/cards.js` — the rules: deck, turns, playing a card, Resonance, advantage, win/loss
- `game/src/ai.js` — Zyra: the readable heuristic and her intent badge
- `game/src/input.js` — mouse and keyboard, table coordinates, fanned-hand slots
- `game/src/render.js` — canvas drawing: felt table, cards, HUD, all four screens
- `game/src/animate.js` — tweens, deal flights, floating numbers, ember particles
- `game/src/audio.js` — synthesised WebAudio bleeps, no audio files
- `game/src/shots.js` — the `?shot=` screenshot scenes (real games, fixed seeds)
- `game/src/random.js` — seeded RNG (mulberry32)
- `game/src/main.js` — boot, the game loop, and the state machine
- `main.ts` — hands the game in (copies game/ + screenshots/ to /output, writes dossier.json)
