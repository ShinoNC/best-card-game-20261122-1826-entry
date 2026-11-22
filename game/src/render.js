// Every pixel of EMBERFALL: the felt table, the cards, the HUD, and the four
// screens (title, table, win, loss). All text is drawn bold and light on dark,
// or dark on cream, so it stays readable at thumbnail size.
// Layout helpers (button rectangles, hand slots) are exported for input.js.

import {
  AI_HAND_Y, CARD_H, CARD_MINI_H, CARD_MINI_W, CARD_W, COLORS, ELEMENTS,
  MAX_EMBER, MAX_HP, PLAYER_HAND_Y, TABLE_HEIGHT, TABLE_WIDTH,
} from './config.js';
import { fanSlot } from './input.js';
import { stepDealFlight } from './animate.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, font, color, align) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// The table: dark green felt with a radial glow and a gold inner trim.
export function drawFelt(ctx) {
  const g = ctx.createRadialGradient(640, 330, 80, 640, 360, 820);
  g.addColorStop(0, COLORS.feltA);
  g.addColorStop(0.65, '#123a22');
  g.addColorStop(1, COLORS.feltB);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.55;
  roundRect(ctx, 14, 14, TABLE_WIDTH - 28, TABLE_HEIGHT - 28, 18);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(201,162,39,0.18)';
  ctx.lineWidth = 1;
  roundRect(ctx, 26, 26, TABLE_WIDTH - 52, TABLE_HEIGHT - 52, 12);
  ctx.stroke();
}

// One card face. `w`/`h` scale the whole card (hand cards are 140x200, the
// title fan uses the same size). `opts.hover` lifts it, `opts.dim` greys it
// when it cannot be played.
export function drawCardFace(ctx, card, x, y, w, h, opts) {
  const o = opts || {};
  const el = ELEMENTS[card.element];
  const scale = w / CARD_W;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (o.angle) ctx.rotate(o.angle);
  ctx.translate(-w / 2, -h / 2);
  if (o.hover) ctx.translate(0, -14 * scale);
  roundRect(ctx, 0, 0, w, h, 12 * scale);
  ctx.fillStyle = COLORS.cream;
  ctx.fill();
  ctx.lineWidth = 2 * scale;
  ctx.strokeStyle = o.dim ? '#9a8f7a' : el.color;
  ctx.stroke();
  if (o.dim) ctx.globalAlpha = 0.75;
  // Element band across the top: dark element colour, white bold name + glyph.
  ctx.fillStyle = el.dark;
  roundRect(ctx, 0, 0, w, 34 * scale, 12 * scale);
  ctx.fill();
  ctx.fillRect(0, 20 * scale, w, 14 * scale);
  text(ctx, `${el.glyph} ${el.name.toUpperCase()}`, w / 2, 17 * scale, `bold ${13 * scale}px Georgia, serif`, COLORS.white);
  // Cost crystal, top left.
  ctx.beginPath();
  ctx.arc(20 * scale, 52 * scale, 15 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#1d4ed8';
  ctx.fill();
  ctx.lineWidth = 2 * scale;
  ctx.strokeStyle = COLORS.white;
  ctx.stroke();
  text(ctx, String(card.cost), 20 * scale, 53 * scale, `bold ${17 * scale}px Georgia, serif`, COLORS.white);
  // Type tag, top right.
  const typeLabel = card.type === 'strike' ? 'STRIKE' : card.type === 'guard' ? 'GUARD' : 'SURGE';
  text(ctx, typeLabel, w - 10 * scale, 52 * scale, `bold ${11 * scale}px Georgia, serif`, COLORS.inkSoft, 'right');
  // Big power number in the middle.
  if (card.type !== 'surge') {
    text(ctx, String(card.power), w / 2, 108 * scale, `bold ${52 * scale}px Georgia, serif`, COLORS.ink);
    text(ctx, card.type === 'strike' ? 'DAMAGE' : 'BLOCK', w / 2, 142 * scale, `bold ${11 * scale}px Georgia, serif`, COLORS.inkSoft);
  } else {
    text(ctx, el.glyph, w / 2, 108 * scale, `${46 * scale}px Georgia, serif`, el.color);
  }
  // Name and one line of effect text at the bottom.
  text(ctx, card.name, w / 2, 162 * scale, `bold ${14 * scale}px Georgia, serif`, COLORS.ink);
  text(ctx, card.text, w / 2, 182 * scale, `${11 * scale}px Georgia, serif`, COLORS.inkSoft);
  ctx.restore();
}

// A face-down card back: dark green with a gold border and a gold flame emblem.
export function drawCardBack(ctx, x, y, w, h, angle) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (angle) ctx.rotate(angle);
  ctx.translate(-w / 2, -h / 2);
  roundRect(ctx, 0, 0, w, h, 10);
  ctx.fillStyle = '#0f3d22';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.gold;
  ctx.stroke();
  roundRect(ctx, 7, 7, w - 14, h - 14, 7);
  ctx.strokeStyle = 'rgba(201,162,39,0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();
  text(ctx, '▲', w / 2, h / 2 - 4, `${Math.round(h * 0.32)}px Georgia, serif`, COLORS.goldBright);
  text(ctx, 'EMBERFALL', w / 2, h - 18, `bold ${Math.round(w * 0.09)}px Georgia, serif`, COLORS.goldBright);
  ctx.restore();
}

// HP bar: dark track, green fill (red under 10). The numbers sit beside the
// bar on the felt, in white bold, never on top of the coloured fill.
export function drawHpBar(ctx, x, y, w, hp, maxHp, label) {
  text(ctx, label, x, y + 11, 'bold 15px Georgia, serif', COLORS.white, 'left');
  const barX = x + 64;
  const barW = w - 64 - 78;
  roundRect(ctx, barX, y, barW, 20, 10);
  ctx.fillStyle = COLORS.track;
  ctx.fill();
  const fill = Math.max(0, hp / maxHp);
  if (fill > 0) {
    roundRect(ctx, barX, y, barW * fill, 20, 10);
    ctx.fillStyle = hp <= 10 ? COLORS.hpLow : COLORS.hpGood;
    ctx.fill();
  }
  text(ctx, `${hp} / ${maxHp}`, barX + barW + 10, y + 11, 'bold 15px Georgia, serif', COLORS.white, 'left');
}

// Ember crystals: filled gold diamonds for ember held, hollow for the rest.
export function drawEmber(ctx, x, y, ember, maxEmber) {
  text(ctx, 'EMBER', x, y + 10, 'bold 14px Georgia, serif', COLORS.white, 'left');
  for (let i = 0; i < maxEmber; i += 1) {
    const cx = x + 66 + i * 24;
    ctx.save();
    ctx.translate(cx, y + 10);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = i < ember ? COLORS.goldBright : 'rgba(255,255,255,0.18)';
    ctx.strokeStyle = i < ember ? COLORS.gold : 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-7, -7, 14, 14);
    ctx.strokeRect(-7, -7, 14, 14);
    ctx.restore();
  }
  text(ctx, `${ember} / ${maxEmber}`, x + 66 + maxEmber * 24 + 8, y + 10, 'bold 14px Georgia, serif', COLORS.white, 'left');
}

// A button. `style` is 'gold' (black bold text on gold) or 'ghost' (white bold
// text on a dark outline). Returns nothing; hit rects are exported separately.
export function drawButton(ctx, rect, label, style) {
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  if (style === 'gold') {
    ctx.fillStyle = COLORS.gold;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORS.goldBright;
    ctx.stroke();
    text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, 'bold 20px Georgia, serif', '#17122b');
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORS.gold;
    ctx.stroke();
    text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, 'bold 20px Georgia, serif', COLORS.white);
  }
}

// Button rectangles, so clicks can be hit-tested without re-laying out.
export function titleButtons() {
  return {
    play: { x: 530, y: 288, w: 220, h: 62 },
    how: { x: 530, y: 366, w: 220, h: 62 },
  };
}
export function tableButtons() {
  return { endTurn: { x: 1060, y: 440, w: 160, h: 56 } };
}
export function endButtons() {
  return { again: { x: 530, y: 556, w: 220, h: 62 } };
}

// Where each hand card sits on the table (fanned, slight rotation).
export function playerHandSlots(hand) {
  return hand.map((card, i) => {
    const slot = fanSlot(i, hand.length, 640, PLAYER_HAND_Y, 150, 0);
    return { card, x: slot.x, y: slot.y, angle: slot.angle };
  });
}
export function aiHandSlots(count) {
  const slots = [];
  for (let i = 0; i < count; i += 1) {
    const slot = fanSlot(i, count, 640, AI_HAND_Y, 112, 0);
    slots.push({ x: slot.x, y: slot.y, angle: slot.angle });
  }
  return slots;
}

// ---- Screens ----

function drawHowPanel(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  roundRect(ctx, 290, 110, 700, 500, 16);
  ctx.fillStyle = '#0f2c1c';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.gold;
  ctx.stroke();
  text(ctx, 'HOW TO PLAY', 640, 152, 'bold 30px Georgia, serif', COLORS.goldBright);
  const lines = [
    'You and Zyra each start at 30 HP. First to 0 loses.',
    'Each turn: draw 1 card, gain 1 ember. Play cards, then END TURN.',
    'STRIKE deals damage. GUARD gives block. SURGE draws, heals, or gives ember.',
    'Ember beats Gale · Gale beats Tide · Tide beats Stone · Stone beats Ember.',
    'A Strike against the element it beats deals +2 damage.',
    'Play 2+ cards of one element in a turn: RESONANCE, +2 damage or block.',
    'Watch Zyra\u2019s intent badge: it shows her real next move. Counter it.',
    'Click a card to play it · keys 1-5 play · Space ends your turn.',
  ];
  lines.forEach((line, i) => {
    text(ctx, line, 640, 196 + i * 34, '16px Georgia, serif', COLORS.white);
  });
  text(ctx, 'Click anywhere to close.', 640, 566, 'bold 16px Georgia, serif', COLORS.goldBright);
}

export function drawTitle(ctx, game, ui) {
  drawFelt(ctx);
  // Faint element glyphs in the corners set the mood.
  ctx.globalAlpha = 0.16;
  text(ctx, '▲', 120, 130, '120px Georgia, serif', '#ff5a5a');
  text(ctx, '●', 1160, 130, '120px Georgia, serif', '#5aa2ff');
  text(ctx, '◆', 120, 620, '120px Georgia, serif', '#e8b93a');
  text(ctx, '✦', 1160, 620, '120px Georgia, serif', '#4fd8c8');
  ctx.globalAlpha = 1;
  text(ctx, 'EMBERFALL', 640, 168, 'bold 92px Georgia, serif', COLORS.goldBright);
  text(ctx, 'DUEL OF THE FOUR WINDS', 640, 238, 'bold 26px Georgia, serif', COLORS.white);
  const btns = titleButtons();
  drawButton(ctx, btns.play, 'PLAY', 'gold');
  drawButton(ctx, btns.how, 'HOW TO PLAY', 'ghost');
  // A fanned hand of five cards across the bottom third.
  const fan = game.titleFan || [];
  fan.forEach((card, i) => {
    const slot = fanSlot(i, fan.length, 640, 452, 150, 0);
    drawCardFace(ctx, card, slot.x, slot.y, CARD_W, CARD_H, { angle: slot.angle });
  });
  text(ctx, 'A duel of elements · 30 HP · First to fall loses', 640, 700, 'bold 15px Georgia, serif', COLORS.white);
  if (ui.showHow) drawHowPanel(ctx);
}

function drawPlayArea(ctx, game, ui) {
  const p = game.player.lastPlayed;
  const a = game.ai.lastPlayed;
  if (p) drawCardFace(ctx, p, 500, 246, CARD_W, CARD_H, {});
  if (a) drawCardFace(ctx, a, 700, 246, CARD_W, CARD_H, {});
  if (!p && !a) {
    text(ctx, 'Play a card — it lands here.', 640, 340, 'italic 18px Georgia, serif', 'rgba(255,255,255,0.75)');
  }
  // Resonance badge, glowing when a combo is live this turn. It sits left of
  // the played cards, clear of both hands.
  const active = game.player.playedElements.length >= 2
    || game.ai.playedElements.length >= 2;
  if (active) {
    const now = ui.now ?? Date.now();
    const pulse = 0.75 + 0.25 * Math.sin(now / 240);
    ctx.globalAlpha = pulse;
    roundRect(ctx, 272, 330, 200, 34, 17);
    ctx.fillStyle = '#7c3aed';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORS.goldBright;
    ctx.stroke();
    ctx.globalAlpha = 1;
    text(ctx, '✦ RESONANCE ×2 ✦', 372, 348, 'bold 16px Georgia, serif', COLORS.white);
  }
}

export function drawTable(ctx, game, ui) {
  drawFelt(ctx);
  const ai = game.ai;
  const player = game.player;
  // Top strip: Zyra's avatar, name, HP, and her intent badge.
  ctx.beginPath();
  ctx.arc(84, 56, 34, 0, Math.PI * 2);
  ctx.fillStyle = ELEMENTS.gale.dark;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.gold;
  ctx.stroke();
  text(ctx, '✦', 84, 58, '34px Georgia, serif', COLORS.white);
  text(ctx, 'ZYRA, WIND CALLER', 134, 42, 'bold 19px Georgia, serif', COLORS.white, 'left');
  drawHpBar(ctx, 134, 58, 330, ai.hp, MAX_HP, 'HP');
  if (game.intent) {
    const badge = game.intent.kind === 'attack' ? '#8f1420'
      : game.intent.kind === 'guard' ? '#0f4d99' : '#4c1d95';
    roundRect(ctx, 500, 40, 220, 36, 18);
    ctx.fillStyle = badge;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORS.white;
    ctx.stroke();
    text(ctx, game.intent.text, 610, 59, 'bold 16px Georgia, serif', COLORS.white);
  }
  text(ctx, `TURN ${game.turn}`, 1240, 42, 'bold 19px Georgia, serif', COLORS.white, 'right');
  // Zyra's hand: face-down backs, fanned.
  for (const slot of aiHandSlots(ai.hand.length)) {
    drawCardBack(ctx, slot.x, slot.y, CARD_MINI_W, CARD_MINI_H, slot.angle);
  }
  text(ctx, `${ai.hand.length} cards`, 640, 238, 'bold 14px Georgia, serif', COLORS.white);
  drawPlayArea(ctx, game, ui);
  // Player info row.
  drawHpBar(ctx, 40, 452, 300, player.hp, MAX_HP, 'YOU');
  if (player.block > 0) {
    roundRect(ctx, 356, 448, 110, 28, 14);
    ctx.fillStyle = '#1d4ed8';
    ctx.fill();
    text(ctx, `🛡 ${player.block} block`, 411, 463, 'bold 15px Georgia, serif', COLORS.white);
  }
  drawEmber(ctx, 480, 452, player.ember, MAX_EMBER);
  const btns = tableButtons();
  drawButton(ctx, btns.endTurn, 'END TURN', 'gold');
  // Deck piles with counts, clear of the END TURN button below.
  drawCardBack(ctx, 40, 268, CARD_MINI_W, CARD_MINI_H, 0);
  text(ctx, `${player.deck.length}`, 88, 420, 'bold 18px Georgia, serif', COLORS.white);
  if (player.discard.length > 0) {
    drawCardBack(ctx, 1144, 268, CARD_MINI_W, CARD_MINI_H, 0);
    text(ctx, `${player.discard.length}`, 1192, 420, 'bold 18px Georgia, serif', COLORS.white);
  }
  // The player's hand, face-up and readable. Cards still flying in from the
  // deck are drawn at their flight position (back while they flip over).
  for (const slot of playerHandSlots(player.hand)) {
    const flight = ui.flights ? ui.flights.get(slot.card.uid) : null;
    if (flight && !flight.done) {
      const pos = stepDealFlight(flight, ui.dt || 16);
      if (pos.faceUp) {
        drawCardFace(ctx, slot.card, pos.x, pos.y, CARD_W, CARD_H, { angle: slot.angle });
      } else {
        drawCardBack(ctx, pos.x, pos.y, CARD_W, CARD_H, slot.angle);
      }
      if (flight.done) ui.flights.delete(slot.card.uid);
      continue;
    }
    const hovered = ui.hoverUid === slot.card.uid;
    const affordable = player.ember >= slot.card.cost;
    drawCardFace(ctx, slot.card, slot.x, slot.y, CARD_W, CARD_H, {
      angle: slot.angle, hover: hovered, dim: !affordable,
    });
  }
  // One-line status message under the play area, above the hand.
  if (game.message) {
    text(ctx, game.message, 640, 479, '14px Georgia, serif', COLORS.white);
  }
}

function drawScorePanel(ctx, game) {
  roundRect(ctx, 440, 300, 400, 190, 14);
  ctx.fillStyle = COLORS.cream;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.gold;
  ctx.stroke();
  const rows = [
    ['Turns', String(game.stats.turns)],
    ['Damage dealt', String(game.stats.damageDealt)],
    ['Cards played', String(game.stats.cardsPlayed)],
    ['Resonance triggers', String(game.stats.resonanceTriggers)],
  ];
  rows.forEach(([label, value], i) => {
    const y = 332 + i * 40;
    text(ctx, label, 470, y, 'bold 17px Georgia, serif', COLORS.inkSoft, 'left');
    text(ctx, value, 810, y, 'bold 19px Georgia, serif', COLORS.ink, 'right');
  });
}

export function drawEnd(ctx, game, ui, won) {
  drawFelt(ctx);
  // Dim the table behind the result.
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  if (won) {
    text(ctx, 'VICTORY', 640, 190, 'bold 96px Georgia, serif', COLORS.goldBright);
    text(ctx, 'The four winds bow to you.', 640, 252, 'italic bold 22px Georgia, serif', COLORS.white);
  } else {
    text(ctx, 'DEFEAT', 640, 190, 'bold 96px Georgia, serif', '#ff6b6b');
    text(ctx, 'The winds turn against you... for now.', 640, 252, 'italic bold 22px Georgia, serif', COLORS.white);
  }
  drawScorePanel(ctx, game);
  const btns = endButtons();
  drawButton(ctx, btns.again, won ? 'PLAY AGAIN' : 'TRY AGAIN', 'gold');
  text(ctx, won ? 'Zyra falls. The duel is yours.' : 'Zyra stands. Deal again and take the winds back.', 640, 660, 'bold 16px Georgia, serif', COLORS.white);
}

// Floating damage numbers and ember sparks, drawn over everything.
export function drawFloaters(ctx, floaters) {
  for (const f of floaters) {
    if (f.done) continue;
    const t = f.elapsed / f.durationMs;
    ctx.globalAlpha = 1 - t;
    text(ctx, f.text, f.x, f.y - t * 46, 'bold 26px Georgia, serif', f.color);
  }
  ctx.globalAlpha = 1;
}

export function drawParticles(ctx, particles) {
  for (const p of particles) {
    if (p.done) continue;
    const t = p.elapsed / p.lifeMs;
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// One frame: pick the screen and draw it.
export function render(ctx, game, ui) {
  ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);
  if (game.screen === SCREEN_TITLE) drawTitle(ctx, game, ui);
  else if (game.screen === SCREEN_WIN) drawEnd(ctx, game, ui, true);
  else if (game.screen === SCREEN_LOSS) drawEnd(ctx, game, ui, false);
  else drawTable(ctx, game, ui);
  drawParticles(ctx, ui.particles);
  drawFloaters(ctx, ui.floaters);
}
