// The game's contract: it can be finished, and a save reads back as written. `npm test`.
import { describe, expect, it } from 'vitest';
import { Engine, FakePresenter, MemoryStore, parseSave, saveEnvelope, solve } from '@quest-n-click/engine/testing';
import { game, layouts } from '..';

describe('the game', () => {
  it('can be finished from a new game', async () => {
    const result = await solve(game, layouts, { mode: 'witness' });
    expect(result.status).toBe('solved');
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('reads its save back as written', async () => {
    const engine = new Engine(game, layouts, new FakePresenter(), new MemoryStore());
    // A new game may end on a guided action that waits for a player: don't wait for one.
    await Promise.race([engine.newGame(), new Promise((r) => setTimeout(r, 300))]);
    expect(parseSave(game, saveEnvelope(game, engine.state))).toEqual(engine.state);
  });

  it('configures intro/room MIDI music, rain & traffic ambient sfx, and 2/3 screen height characters', () => {
    expect(game.titleScreen?.music).toBe('intro');
    expect(game.audio?.music).toMatchObject({
      intro: 'intro.mp3',
      car: 'car.mp3',
      street: 'street.mp3',
      bank: 'bank.mp3',
      tense: 'tense.mp3',
      end: 'end.mp3',
    });
    expect(game.audio?.sfx).toMatchObject({
      rain: 'rain.mp3',
      rain_indoor: 'rain_indoor.mp3',
      traffic: 'traffic.mp3',
    });
    for (const r of game.rooms) {
      expect(r.music).toBeTruthy();
      const lay = layouts[r.id];
      for (const actor of Object.values(lay?.actors ?? {})) {
        expect(actor.h).toBeGreaterThanOrEqual(250);
        expect(actor.h).toBeLessThanOrEqual(280);
      }
    }
  });
});
