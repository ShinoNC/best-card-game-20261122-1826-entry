// Zyra, the AI opponent: a readable heuristic the player can see coming and play
// around. The plan is decided at the start of the player's turn and stored on the
// game state, so the intent badge shows the AI's REAL next move, never a bluff.

import { ELEMENTS, TYPE_GUARD, TYPE_STRIKE, TYPE_SURGE } from './config.js';

// Count, per element, how many of `cards` share it (wild counts for every element).
function elementCounts(cards) {
  const counts = {};
  for (const card of cards) {
    for (const id of Object.keys(ELEMENTS)) {
      if (card.element === id || card.element === 'wild') counts[id] = (counts[id] || 0) + 1;
    }
  }
  return counts;
}

// Decide the AI's whole next turn from its hand and ember right now. The plan is
// a list of card uids in play order; the intent is the one-line summary the table
// shows above the AI's hand.
export function planAiTurn(state) {
  const ai = state.ai;
  const hand = [...ai.hand];
  let ember = ai.ember;
  const chosen = [];
  const spend = (card) => {
    chosen.push(card.uid);
    ember -= card.cost;
    hand.splice(hand.indexOf(card), 1);
  };
  const affordable = (card) => ember >= card.cost;
  const strikes = hand.filter((c) => c.type === TYPE_STRIKE && affordable(c));
  const guards = hand.filter((c) => c.type === TYPE_GUARD && affordable(c));
  const surges = hand.filter((c) => c.type === TYPE_SURGE && affordable(c));

  // Hurt and holding a shield: guard first, then the cheapest strike.
  if (ai.hp <= 12 && guards.length > 0) {
    const guard = guards.sort((a, b) => a.cost - b.cost)[0];
    spend(guard);
    const cheap = strikes
      .filter((c) => affordable(c))
      .sort((a, b) => a.cost - b.cost)[0];
    if (cheap) spend(cheap);
  } else {
    // Two or more of one element in hand: play the pair for Resonance, then hit.
    const counts = elementCounts(hand.filter(affordable));
    let pairElement = null;
    for (const id of Object.keys(counts)) {
      if (counts[id] >= 2) { pairElement = id; break; }
    }
    if (pairElement) {
      const pair = hand
        .filter((c) => (c.element === pairElement || c.element === 'wild') && affordable(c))
        .sort((a, b) => a.cost - b.cost)
        .slice(0, 2);
      for (const card of pair) spend(card);
      const hit = strikes.filter((c) => affordable(c)).sort((a, b) => b.power - a.power)[0];
      if (hit && !chosen.includes(hit.uid)) spend(hit);
    } else if (strikes.length > 0) {
      // Otherwise: the hardest affordable hit.
      const hit = strikes.sort((a, b) => b.power - a.power)[0];
      spend(hit);
    } else if (surges.length > 0) {
      // Nothing to hit with: charge up instead.
      spend(surges[0]);
    }
  }

  // Summarise the plan as one readable intent line.
  const byUid = new Map(ai.hand.map((c) => [c.uid, c]));
  const planned = chosen.map((uid) => byUid.get(uid));
  const intent = describeIntent(planned);
  return { cards: chosen, intent };
}

// One line for the badge: what the AI is about to do, and how hard it lands.
export function describeIntent(planned) {
  const strike = planned.find((c) => c.type === TYPE_STRIKE);
  const guard = planned.find((c) => c.type === TYPE_GUARD);
  const surge = planned.find((c) => c.type === TYPE_SURGE);
  if (strike) {
    const total = planned
      .filter((c) => c.type === TYPE_STRIKE)
      .reduce((sum, c) => sum + c.power, 0);
    return { kind: 'attack', text: `⚔ Attacks for ${total}`, amount: total };
  }
  if (guard) {
    const total = planned
      .filter((c) => c.type === TYPE_GUARD)
      .reduce((sum, c) => sum + c.power, 0);
    return { kind: 'guard', text: `🛡 Guards ${total}`, amount: total };
  }
  if (surge) return { kind: 'surge', text: '✦ Charges up', amount: 0 };
  return { kind: 'pass', text: '… Holds', amount: 0 };
}
