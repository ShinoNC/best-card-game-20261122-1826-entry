// EMBERFALL — boot, the game loop, and the state machine (title -> deal -> play
// -> AI turn -> win/loss). The rules live in cards.js and ai.js; this file only
// moves the game between screens, answers clicks and keys, and draws frames.

import { CARD_DEFS, TABLE_HEIGHT, TABLE_WIDTH } from './config.js';
import {
  checkEnd, createGame, makeCard, playCard, startGame, startTurn,
} from './cards.js';
import { planAiTurn } from './ai.js';
import { bindInput, pointInRect } from './input.js';
import {
  endButtons, playerHandSlots, render,
  tableButtons, titleButtons,
} from './render.js';
import {
  burst, makeDealFlight, makeFloater, stepDealFlight, stepFloater, stepParticle,
} from './animate.js';
import { ensureAudio, sounds } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
const ctx = canvas.getContext('2d');
canvas.width = TABLE_WIDTH;
canvas.height = TABLE_HEIGHT;

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) ? seedParam : (Date.now() % 2147483647);

// One game plus everything the frame needs that is not a rule.
let game;
let ui;

function freshUi() {
  return {
    hoverUid: null, showHow: false, now: 1000,
    floaters: [], particles: [], flights: new Map(),
    aiBusy: false, aiQueue: [], aiTimer: 0,
  };
}

function newGame(freshSeed) {
  game = createGame(freshSeed);
  ui = freshUi();
}

// The deal: every card in the opening hand slides from the deck pile.
function dealOpeningHand() {
  const slots = playerHandSlots(game.player.hand);
  slots.forEach((slot, i) => {
    ui.flights.set(slot.card.uid, makeDealFlight(88, 358, slot.x, slot.y, i * 70));
  });
  sounds.deal();
}

function setStatus(text) {
  statusLine.textContent = text;
  game.message = text;
}

// --- Playing a card (player) ---

function playPlayerCard(card) {
  if (game.active !== 'player' || game.over || ui.aiBusy) return;
  ensureAudio();
  const event = playCard(game, 'player', card);
  if (!event) return;
  reactToEvent(event);
  const end = checkEnd(game);
  if (end) return endGame(end === 'win');
  setStatus(event.kind === 'strike'
    ? `${card.name} hits for ${event.damage}${event.advantage ? ' — super effective!' : ''}`
    : `${card.name} played.`);
  return null;
}

// Floaters, sparks and sounds for one played card's event.
function reactToEvent(event) {
  if (event.kind === 'strike') {
    const targetIsAi = event.target === 'ai';
    const x = targetIsAi ? 300 : 200;
    const y = targetIsAi ? 70 : 462;
    ui.floaters.push(makeFloater(x, y, `-${event.damage}`, '#ff6b6b'));
    if (event.absorbed > 0) ui.floaters.push(makeFloater(x + 90, y, `blocked ${event.absorbed}`, '#7dd3fc'));
    if (event.advantage) ui.floaters.push(makeFloater(640, 200, 'SUPER EFFECTIVE!', '#f0d060'));
    ui.particles.push(...burst(x, y + 10, 10, game.rng));
    sounds.strike();
  } else if (event.kind === 'guard') {
    const x = event.target === 'player' ? 200 : 300;
    const y = event.target === 'player' ? 462 : 70;
    ui.floaters.push(makeFloater(x, y, `+${event.block} block`, '#7dd3fc'));
    sounds.guard();
  } else {
    const x = 640;
    const y = event.target === 'player' ? 520 : 200;
    ui.floaters.push(makeFloater(x, y, cardEffectText(event), '#f0d060'));
    sounds.surge();
  }
  if (event.resonant) {
    ui.floaters.push(makeFloater(640, 180, 'RESONANCE ×2', '#c084fc'));
    sounds.resonance();
  }
}

function cardEffectText(event) {
  if (event.effect === 'draw2') return `Draw ${event.drawn}`;
  if (event.effect === 'heal4') return `+${event.healed} HP`;
  if (event.effect === 'ember2') return '+2 ember';
  if (event.effect === 'draw1ember1') return 'Draw 1 · +1 ember';
  return 'Surge!';
}

// --- Turn flow ---

function endPlayerTurn() {
  if (game.active !== 'player' || game.over || ui.aiBusy) return;
  ensureAudio();
  sounds.click();
  game.active = 'ai';
  ui.aiBusy = true;
  ui.aiQueue = [...(game.aiPlan ? game.aiPlan.cards : [])];
  ui.aiTimer = 500;
  startTurn(game, 'ai');
  setStatus('Zyra takes her turn…');
}

function finishAiTurn() {
  ui.aiBusy = false;
  const end = checkEnd(game);
  if (end) return endGame(end === 'win');
  game.turn += 1;
  game.stats.turns = game.turn;
  game.active = 'player';
  startTurn(game, 'player');
  const plan = planAiTurn(game);
  game.aiPlan = plan;
  game.intent = plan.intent;
  setStatus(`Turn ${game.turn} — your move. Zyra plans: ${plan.intent.text}.`);
}

function endGame(won) {
  game.over = true;
  if (won) {
    sounds.win();
    for (let i = 0; i < 60; i += 1) {
      ui.particles.push(...burst(200 + game.rng() * 880, 300 + game.rng() * 200, 1, game.rng));
    }
    setStatus(`Victory in ${game.stats.turns} turns!`);
  } else {
    sounds.loss();
    setStatus('Defeat. The winds turn against you... for now.');
  }
}

function startDuel() {
  startGame(game);
  const plan = planAiTurn(game);
  game.aiPlan = plan;
  game.intent = plan.intent;
  setStatus(`Turn 1 — your move. Zyra plans: ${plan.intent.text}.`);
  dealOpeningHand();
}

// --- Input ---

function clickTitle(point) {
  const btns = titleButtons();
  if (ui.showHow) { ui.showHow = false; return; }
  if (pointInRect(point, btns.play)) { sounds.click(); startDuel(); }
  else if (pointInRect(point, btns.how)) { sounds.click(); ui.showHow = true; }
}

function clickTable(point) {
  if (ui.aiBusy || game.active !== 'player') return;
  const btns = tableButtons();
  if (pointInRect(point, btns.endTurn)) { endPlayerTurn(); return; }
  for (const slot of playerHandSlots(game.player.hand)) {
    const rect = { x: slot.x, y: slot.y, w: 140, h: 200 };
    if (pointInRect(point, rect)) {
      playPlayerCard(slot.card);
      return;
    }
  }
}

function clickEnd(point) {
  const btns = endButtons();
  if (pointInRect(point, btns.again)) {
    sounds.click();
    newGame((Date.now() % 2147483647) + 1);
    game.screen = 'title';
    game.titleFan = null;
    setStatus('Emberfall — Duel of the Four Winds.');
  }
}

function onClick(point) {
  ensureAudio();
  if (game.screen === 'title') clickTitle(point);
  else if (game.screen === 'play') clickTable(point);
  else clickEnd(point);
}

function onMove(point) {
  if (game.screen !== 'play') { ui.hoverUid = null; return; }
  ui.hoverUid = null;
  for (const slot of playerHandSlots(game.player.hand)) {
    if (pointInRect(point, { x: slot.x, y: slot.y, w: 140, h: 200 })) {
      ui.hoverUid = slot.card.uid;
      break;
    }
  }
}

function onKey(key) {
  ensureAudio();
  if (key === 'Escape' && ui.showHow) { ui.showHow = false; return; }
  if (game.screen === 'title' && (key === 'Enter' || key === ' ')) { startDuel(); return; }
  if (game.screen !== 'play' || ui.aiBusy || game.active !== 'player') return;
  if (key === ' ') { endPlayerTurn(); return; }
  const index = Number(key) - 1;
  if (index >= 0 && index < game.player.hand.length) {
    playPlayerCard(game.player.hand[index]);
  }
}

bindInput(canvas, { onMove, onClick, onKey });

// --- Frame loop ---

let lastTime = 0;

function frame(time) {
  const dt = Math.min(50, time - (lastTime || time));
  lastTime = time;
  ui.now = time;
  ui.dt = dt;
  // AI turn: play one planned card every 650 ms.
  if (ui.aiBusy) {
    ui.aiTimer -= dt;
    if (ui.aiTimer <= 0) {
      const uid = ui.aiQueue.shift();
      if (uid === undefined) {
        finishAiTurn();
      } else {
        const card = game.ai.hand.find((c) => c.uid === uid);
        if (card) {
          const event = playCard(game, 'ai', card);
          if (event) reactToEvent(event);
        }
        ui.aiTimer = 650;
        if (checkEnd(game)) endGame(game.ai.hp <= 0);
      }
    }
  }
  // Step the effects.
  for (const floater of ui.floaters) stepFloater(floater, dt);
  ui.floaters = ui.floaters.filter((f) => !f.done);
  for (const p of ui.particles) stepParticle(p, dt);
  ui.particles = ui.particles.filter((p) => !p.done);
  render(ctx, game, ui);
  if (!shotName) requestAnimationFrame(frame);
}

// --- Screenshot mode (?shot=title|table|win|loss&seed=N) ---

if (shotName) {
  const staged = stageShot(shotName, seed);
  game = staged.game;
  ui = staged.ui;
  ui.now = 1000;
  // Let the win screen's sparks settle mid-flight, then paint one frame.
  for (let i = 0; i < 24; i += 1) {
    for (const p of ui.particles) stepParticle(p, 50);
  }
  render(ctx, game, ui);
  document.title = 'shot-ready';
  window.__shotReady = true;
} else {
  newGame(seed);
  // The title screen shows a fanned hand of one card per element.
  game.titleFan = ['inferno', 'maelstrom', 'avalanche', 'hurricane', 'emberfall']
    .map((id) => makeCard(CARD_DEFS.find((d) => d.id === id)));
  setStatus('Emberfall — Duel of the Four Winds.');
  requestAnimationFrame(frame);
}
