// The rules of EMBERFALL, with no drawing and no browser in sight: the deck, the
// turns, playing a card, Resonance, the element advantage, and winning or losing.
// main.js wires this to the canvas; the Node playtest imports this file directly.

import {
  ADVANTAGE_BONUS, BEATS, CARD_DEFS, MAX_EMBER, MAX_HAND, MAX_HP,
  RESONANCE_BONUS, RESONANCE_COUNT, START_EMBER, START_HAND,
  TYPE_GUARD, TYPE_STRIKE, TYPE_SURGE,
} from './config.js';
import { mulberry32, shuffle } from './random.js';

let nextUid = 1;

// One physical card: a copy of a CARD_DEFS entry with its own identity.
export function makeCard(def) {
  return { uid: nextUid++, ...def };
}

export function buildDeck(rng) {
  const deck = CARD_DEFS.map((def) => makeCard(def));
  return shuffle(rng, deck);
}

function makeSide(rng) {
  return {
    hp: MAX_HP, ember: START_EMBER, block: 0, guardElement: null,
    hand: [], deck: buildDeck(rng), discard: [],
    // Cards played this turn, by element id (wild counts under every element).
    playedElements: [],
    // The last card this side played, kept on the table until the turn ends.
    lastPlayed: null,
  };
}

// A fresh duel. `seed` fixes every shuffle, so the same seed deals the same game.
export function createGame(seed) {
  const rng = mulberry32(seed);
  const state = {
    seed,
    rng,
    screen: 'title',
    turn: 1,
    // 'player' moves first; 'ai' is the computer's turn.
    active: 'player',
    player: makeSide(rng),
    ai: makeSide(rng),
    // The AI's plan for its coming turn, decided at the start of the player's
    // turn, so the intent badge always shows its real next move.
    aiPlan: null,
    intent: null,
    message: '',
    log: [],
    stats: { damageDealt: 0, cardsPlayed: 0, resonanceTriggers: 0, turns: 0 },
    over: false,
  };
  drawCards(state, state.player, START_HAND);
  drawCards(state, state.ai, START_HAND);
  return state;
}

export function otherSide(side) {
  return side === 'player' ? 'ai' : 'player';
}

export function sideState(state, side) {
  return side === 'player' ? state.player : state.ai;
}

// Draw up to `count` cards; a hand never holds more than MAX_HAND, and an empty
// deck is reshuffled from the discard pile (except the cards just played).
export function drawCards(state, side, count) {
  let drawn = 0;
  for (let i = 0; i < count; i += 1) {
    if (side.hand.length >= MAX_HAND) break;
    if (side.deck.length === 0) {
      if (side.discard.length === 0) break;
      side.deck = shuffle(state.rng, side.discard.splice(0));
    }
    side.hand.push(side.deck.pop());
    drawn += 1;
  }
  return drawn;
}

// Start of a side's turn: block from last turn fades, +1 ember, draw 1 card.
export function startTurn(state, side) {
  const me = sideState(state, side);
  me.block = 0;
  me.guardElement = null;
  me.playedElements = [];
  me.lastPlayed = null;
  me.ember = Math.min(MAX_EMBER, me.ember + 1);
  drawCards(state, me, 1);
}

// How many cards of `element` this side has played this turn (wild counts for all).
export function elementPlays(state, side, element) {
  const me = sideState(state, side);
  let count = 0;
  for (const el of me.playedElements) {
    if (el === element || el === 'wild') count += 1;
  }
  return count;
}

// Resonance is live for an element once 2+ cards of it went down this turn.
export function resonanceActive(state, side, element) {
  return elementPlays(state, side, element) >= RESONANCE_COUNT;
}

export function canPlay(state, side, card) {
  const me = sideState(state, side);
  return me.hand.includes(card) && me.ember >= card.cost && !state.over;
}

// Deal damage through block. Returns the HP actually lost.
export function dealDamage(state, side, amount) {
  const me = sideState(state, side);
  const absorbed = Math.min(me.block, amount);
  me.block -= absorbed;
  const hpLost = amount - absorbed;
  me.hp = Math.max(0, me.hp - hpLost);
  return { hpLost, absorbed };
}

function note(state, text) {
  state.log.push(text);
  if (state.log.length > 40) state.log.shift();
}

// Play one card from a hand. Returns an event describing what happened, for the
// animation and sound layers; null when the card cannot be played.
export function playCard(state, side, card) {
  const me = sideState(state, side);
  const foe = sideState(state, otherSide(side));
  if (!canPlay(state, side, card)) return null;
  me.ember -= card.cost;
  me.hand.splice(me.hand.indexOf(card), 1);
  me.discard.push(card);
  me.playedElements.push(card.element);
  me.lastPlayed = card;
  state.stats.cardsPlayed += 1;

  const resonant = resonanceActive(state, side, card.element);
  if (resonant && me.playedElements.length === RESONANCE_COUNT) {
    state.stats.resonanceTriggers += 1;
  }

  if (card.type === TYPE_STRIKE) {
    let damage = card.power;
    let advantage = false;
    if (resonant) damage += RESONANCE_BONUS;
    // Advantage: the strike beats the element of the defender's guard, if any.
    if (foe.guardElement && BEATS[card.element] === foe.guardElement) {
      damage += ADVANTAGE_BONUS;
      advantage = true;
    }
    const result = dealDamage(state, otherSide(side), damage);
    if (side === 'player') state.stats.damageDealt += result.hpLost;
    note(state, `${card.name} hits for ${damage}${advantage ? ' (super effective)' : ''}.`);
    return {
      kind: 'strike', card, damage, advantage, resonant,
      hpLost: result.hpLost, absorbed: result.absorbed,
      target: otherSide(side),
    };
  }

  if (card.type === TYPE_GUARD) {
    let block = card.power;
    if (resonant) block += RESONANCE_BONUS;
    me.block += block;
    me.guardElement = card.element;
    note(state, `${card.name} raises ${block} block.`);
    return { kind: 'guard', card, block, resonant, target: side };
  }

  // Surge cards: one immediate effect each.
  if (card.effect === 'draw2') {
    const drawn = drawCards(state, me, 2);
    note(state, `${card.name} draws ${drawn}.`);
    return { kind: 'surge', card, effect: 'draw2', drawn, resonant, target: side };
  }
  if (card.effect === 'heal4') {
    const healed = Math.min(4, MAX_HP - me.hp);
    me.hp += healed;
    note(state, `${card.name} restores ${healed} HP.`);
    return { kind: 'surge', card, effect: 'heal4', healed, resonant, target: side };
  }
  if (card.effect === 'ember2') {
    me.ember = Math.min(MAX_EMBER, me.ember + 2);
    note(state, `${card.name} gains 2 ember.`);
    return { kind: 'surge', card, effect: 'ember2', resonant, target: side };
  }
  if (card.effect === 'draw1ember1') {
    const drawn = drawCards(state, me, 1);
    me.ember = Math.min(MAX_EMBER, me.ember + 1);
    note(state, `${card.name} draws ${drawn} and gains 1 ember.`);
    return { kind: 'surge', card, effect: 'draw1ember1', drawn, resonant, target: side };
  }
  return { kind: 'surge', card, effect: card.effect, resonant, target: side };
}

// End the active side's turn and hand over. Returns 'win' | 'loss' | null.
export function checkEnd(state) {
  if (state.ai.hp <= 0) {
    state.screen = 'win';
    state.over = true;
    return 'win';
  }
  if (state.player.hp <= 0) {
    state.screen = 'loss';
    state.over = true;
    return 'loss';
  }
  return null;
}

// Begin the duel from the title screen.
export function startGame(state) {
  state.screen = 'play';
  state.active = 'player';
  state.turn = 1;
  state.stats.turns = 1;
  state.message = 'Your turn — play cards, then end your turn.';
}
