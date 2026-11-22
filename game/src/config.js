// Every fixed number in EMBERFALL: the table size, the four elements, the whole
// 25-card deck, and the balance numbers. No other module invents a card or a cost.

// Canvas size. The game is drawn at exactly this size and scaled by CSS.
export const TABLE_WIDTH = 1280;
export const TABLE_HEIGHT = 720;

// A duel: both sides start here, and the first to reach 0 loses.
export const MAX_HP = 30;
export const MAX_EMBER = 10;
export const START_EMBER = 3;
export const START_HAND = 4;
export const MAX_HAND = 8;

// The four winds. Each element is told apart by colour AND by its shape glyph,
// never by text alone: flame ▲, droplet ●, mountain ◆, swirl ✦.
export const ELEMENTS = {
  ember: { id: 'ember', name: 'Ember', color: '#d21f2b', dark: '#8f1420', glyph: '▲', light: '#fbe3e4' },
  tide: { id: 'tide', name: 'Tide', color: '#1a6fd4', dark: '#0f4d99', glyph: '●', light: '#dfeefd' },
  stone: { id: 'stone', name: 'Stone', color: '#b8860b', dark: '#7a5c06', glyph: '◆', light: '#fdf3d0' },
  gale: { id: 'gale', name: 'Gale', color: '#0d9488', dark: '#086a61', glyph: '✦', light: '#d9f4f1' },
  wild: { id: 'wild', name: 'Wild', color: '#7c3aed', dark: '#4c1d95', glyph: '✦', light: '#ede6fd' },
};

// Who beats whom: Ember beats Gale, Gale beats Tide, Tide beats Stone, Stone beats Ember.
// A Strike against a guard of the element it beats deals +2 damage.
export const BEATS = { ember: 'gale', gale: 'tide', tide: 'stone', stone: 'ember' };
export const ADVANTAGE_BONUS = 2;

// Playing 2+ cards of the same element in one turn: +2 damage to Strikes,
// +2 block to Guards. The wild Emberfall counts toward every element.
export const RESONANCE_COUNT = 2;
export const RESONANCE_BONUS = 2;

// Card types.
export const TYPE_STRIKE = 'strike';
export const TYPE_GUARD = 'guard';
export const TYPE_SURGE = 'surge';

// The deck: 6 cards per element (24) plus the wild Emberfall (25 total).
// power = damage for Strikes, block for Guards. Surge cards carry their effect
// in `effect` instead of a power number.
export const CARD_DEFS = [
  // Ember — fire.
  { id: 'cinder-slash', name: 'Cinder Slash', element: 'ember', type: TYPE_STRIKE, cost: 1, power: 3, text: 'Deal 3 damage.' },
  { id: 'flame-lash', name: 'Flame Lash', element: 'ember', type: TYPE_STRIKE, cost: 2, power: 5, text: 'Deal 5 damage.' },
  { id: 'inferno', name: 'Inferno', element: 'ember', type: TYPE_STRIKE, cost: 4, power: 8, text: 'Deal 8 damage.' },
  { id: 'ashen-wall', name: 'Ashen Wall', element: 'ember', type: TYPE_GUARD, cost: 1, power: 4, text: 'Gain 4 block.' },
  { id: 'pyre-shield', name: 'Pyre Shield', element: 'ember', type: TYPE_GUARD, cost: 3, power: 8, text: 'Gain 8 block.' },
  { id: 'wildfire', name: 'Wildfire', element: 'ember', type: TYPE_SURGE, cost: 2, power: 0, effect: 'draw2', text: 'Draw 2 cards.' },
  // Tide — water.
  { id: 'spray-cut', name: 'Spray Cut', element: 'tide', type: TYPE_STRIKE, cost: 1, power: 3, text: 'Deal 3 damage.' },
  { id: 'tidal-crash', name: 'Tidal Crash', element: 'tide', type: TYPE_STRIKE, cost: 3, power: 6, text: 'Deal 6 damage.' },
  { id: 'maelstrom', name: 'Maelstrom', element: 'tide', type: TYPE_STRIKE, cost: 5, power: 9, text: 'Deal 9 damage.' },
  { id: 'mist-veil', name: 'Mist Veil', element: 'tide', type: TYPE_GUARD, cost: 1, power: 4, text: 'Gain 4 block.' },
  { id: 'deep-barrier', name: 'Deep Barrier', element: 'tide', type: TYPE_GUARD, cost: 2, power: 6, text: 'Gain 6 block.' },
  { id: 'spring-rain', name: 'Spring Rain', element: 'tide', type: TYPE_SURGE, cost: 2, power: 0, effect: 'heal4', text: 'Restore 4 HP.' },
  // Stone — earth.
  { id: 'pebble-shot', name: 'Pebble Shot', element: 'stone', type: TYPE_STRIKE, cost: 1, power: 3, text: 'Deal 3 damage.' },
  { id: 'boulder-rush', name: 'Boulder Rush', element: 'stone', type: TYPE_STRIKE, cost: 2, power: 5, text: 'Deal 5 damage.' },
  { id: 'avalanche', name: 'Avalanche', element: 'stone', type: TYPE_STRIKE, cost: 4, power: 8, text: 'Deal 8 damage.' },
  { id: 'granite-skin', name: 'Granite Skin', element: 'stone', type: TYPE_GUARD, cost: 1, power: 5, text: 'Gain 5 block.' },
  { id: 'fortress', name: 'Fortress', element: 'stone', type: TYPE_GUARD, cost: 3, power: 9, text: 'Gain 9 block.' },
  { id: 'quarry', name: 'Quarry', element: 'stone', type: TYPE_SURGE, cost: 2, power: 0, effect: 'ember2', text: 'Gain 2 ember.' },
  // Gale — wind.
  { id: 'zephyr-cut', name: 'Zephyr Cut', element: 'gale', type: TYPE_STRIKE, cost: 1, power: 3, text: 'Deal 3 damage.' },
  { id: 'cyclone', name: 'Cyclone', element: 'gale', type: TYPE_STRIKE, cost: 3, power: 6, text: 'Deal 6 damage.' },
  { id: 'hurricane', name: 'Hurricane', element: 'gale', type: TYPE_STRIKE, cost: 5, power: 9, text: 'Deal 9 damage.' },
  { id: 'wind-wall', name: 'Wind Wall', element: 'gale', type: TYPE_GUARD, cost: 1, power: 4, text: 'Gain 4 block.' },
  { id: 'tempest-guard', name: 'Tempest Guard', element: 'gale', type: TYPE_GUARD, cost: 2, power: 7, text: 'Gain 7 block.' },
  { id: 'tailwind', name: 'Tailwind', element: 'gale', type: TYPE_SURGE, cost: 1, power: 0, effect: 'draw1ember1', text: 'Draw 1, gain 1 ember.' },
  // Wild — counts as every element for Resonance.
  { id: 'emberfall', name: 'Emberfall', element: 'wild', type: TYPE_STRIKE, cost: 3, power: 6, text: 'Deal 6. Counts as any element.' },
];

// The table's look: dark green felt, gold trim, cream card faces, dark ink.
export const COLORS = {
  feltA: '#1a4d2e',
  feltB: '#0d2b1a',
  feltEdge: '#071a10',
  gold: '#c9a227',
  goldBright: '#f0d060',
  cream: '#fdf6e3',
  ink: '#17122b',
  inkSoft: '#3d3557',
  white: '#ffffff',
  hpGood: '#22c55e',
  hpLow: '#ef4444',
  track: '#1a1a1a',
  muted: '#b8c4b0',
};

// Card geometry on the table.
export const CARD_W = 140;
export const CARD_H = 200;
export const CARD_MINI_W = 96;
export const CARD_MINI_H = 136;

// Where the two hands sit.
export const PLAYER_HAND_Y = 500;
export const AI_HAND_Y = 96;
