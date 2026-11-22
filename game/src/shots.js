// The screenshot scenes behind ?shot=title|table|win|loss. Each one plays the
// real rules forward from a fresh game with a fixed seed, steered by a simple
// scripted pilot, so every frame is what a short real game looks like and the
// same seed always gives the same frame.

import { CARD_DEFS } from './config.js';
import { checkEnd, createGame, makeCard, playCard, startGame, startTurn } from './cards.js';
import { planAiTurn } from './ai.js';
import { makeParticle } from './animate.js';

// One full round: the player's scripted plays, then the AI's planned turn.
// Returns true when the duel ended during the round.
function playRound(state, playerScript) {
  // Player's turn.
  state.active = 'player';
  startTurn(state, 'player');
  const plan = planAiTurn(state);
  state.aiPlan = plan;
  state.intent = plan.intent;
  playerScript(state);
  if (checkEnd(state)) return true;
  // The AI's turn: play exactly the cards its plan named.
  state.active = 'ai';
  startTurn(state, 'ai');
  for (const uid of plan.cards) {
    const card = state.ai.hand.find((c) => c.uid === uid);
    if (card) playCard(state, 'ai', card);
    if (checkEnd(state)) return true;
  }
  state.turn += 1;
  state.stats.turns = state.turn;
  return checkEnd(state) !== null;
}

// The greedy pilot: guard when hurt, heal when badly hurt, otherwise play the
// hardest affordable Strike, then repeat; if no Strike can be afforded, play a
// Surge that draws or gives ember.
function greedyPilot(state) {
  const me = state.player;
  if (me.hp <= 10) {
    const heal = me.hand.find((c) => c.type === 'surge' && c.effect === 'heal4' && c.cost <= me.ember);
    if (heal) playCard(state, 'player', heal);
  }
  if (me.hp <= 14) {
    const guard = me.hand
      .filter((c) => c.type === 'guard' && c.cost <= me.ember)
      .sort((a, b) => b.power - a.power)[0];
    if (guard) playCard(state, 'player', guard);
  }
  for (let plays = 0; plays < 8; plays += 1) {
    const hand = state.player.hand;
    const affordable = hand.filter((c) => c.cost <= state.player.ember);
    const strikes = affordable
      .filter((c) => c.type === 'strike')
      .sort((a, b) => b.power - a.power);
    if (strikes.length > 0) {
      playCard(state, 'player', strikes[0]);
      if (checkEnd(state)) return;
      continue;
    }
    const surge = affordable.find((c) => c.type === 'surge' && c.effect !== 'heal4');
    if (surge) {
      playCard(state, 'player', surge);
      if (checkEnd(state)) return;
      continue;
    }
    break;
  }
}

// The passive pilot: play nothing, and let the AI win.
function passivePilot() {}

// A fresh UI bundle for a staged scene (fixed clock, empty effects).
function freshUi() {
  return { hoverUid: null, showHow: false, floaters: [], particles: [], now: 1000 };
}

// The title screen: a fanned hand of one card per element plus the wild.
export function stageTitle(seed) {
  const game = createGame(seed);
  const wanted = ['inferno', 'maelstrom', 'avalanche', 'hurricane', 'emberfall'];
  game.titleFan = wanted.map((id) => makeCard(CARD_DEFS.find((d) => d.id === id)));
  game.screen = 'title';
  return { game, ui: freshUi() };
}

// The saver pilot: at most one affordable Strike per turn, so ember builds up
// and the table shot shows a real mid-game hand and ember pile.
function saverPilot(state) {
  const strikes = state.player.hand
    .filter((c) => c.type === 'strike' && c.cost <= state.player.ember)
    .sort((a, b) => b.power - a.power);
  if (strikes.length > 0) playCard(state, 'player', strikes[0]);
}

// A mid-game table: four full rounds in, then the player's fifth turn with one
// Strike already on the table beside the AI's last card.
export function stageTable(seed) {
  const game = createGame(seed);
  startGame(game);
  for (let round = 0; round < 4; round += 1) {
    if (playRound(game, saverPilot)) break;
  }
  if (!game.over) {
    stateForTable(game);
  }
  return { game, ui: freshUi() };
}

function stateForTable(game) {
  game.active = 'player';
  startTurn(game, 'player');
  const plan = planAiTurn(game);
  game.aiPlan = plan;
  game.intent = plan.intent;
  // Play up to two affordable cards, preferring a same-element pair so the
  // Resonance badge lights up on the table.
  for (let plays = 0; plays < 2; plays += 1) {
    const affordable = game.player.hand.filter((c) => c.cost <= game.player.ember);
    if (affordable.length === 0) break;
    const first = game.player.playedElements[0];
    const same = first
      ? affordable.filter((c) => c.element === first || c.element === 'wild')
      : [];
    const pick = same.sort((a, b) => b.power - a.power)[0]
      || affordable.filter((c) => c.type === 'strike').sort((a, b) => b.power - a.power)[0]
      || affordable[0];
    playCard(game, 'player', pick);
    if (checkEnd(game)) break;
  }
  game.message = 'Your turn — the winds favour the bold. End your turn when ready.';
}

// The win screen: the greedy pilot attacks until Zyra falls.
export function stageWin(seed) {
  const game = createGame(seed);
  startGame(game);
  for (let round = 0; round < 200 && !game.over; round += 1) {
    playRound(game, greedyPilot);
  }
  const ui = freshUi();
  // Ember sparks already mid-flight across the win screen.
  for (let i = 0; i < 42; i += 1) {
    const p = makeParticle(
      120 + game.rng() * 1040, 640 - game.rng() * 320,
      (game.rng() - 0.5) * 30, -30 - game.rng() * 60,
      2 + game.rng() * 3,
      game.rng() < 0.5 ? '#f0d060' : '#ff7a1a',
      1600,
    );
    p.elapsed = game.rng() * 1200;
    ui.particles.push(p);
  }
  return { game, ui };
}

// The loss screen: the passive pilot never plays, and Zyra wins.
export function stageLoss(seed) {
  const game = createGame(seed);
  startGame(game);
  for (let round = 0; round < 200 && !game.over; round += 1) {
    playRound(game, passivePilot);
  }
  return { game, ui: freshUi() };
}

// Set `game` to the named scene (title, table, win, loss; anything else is title).
export function stageShot(name, seed) {
  if (name === 'table') return stageTable(seed);
  if (name === 'win') return stageWin(seed);
  if (name === 'loss') return stageLoss(seed);
  return stageTitle(seed);
}