'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createSimulation } = require('../src/engine.js');
const seeded = () => { let s = 13; return () => ((s = (1664525 * s + 1013904223) >>> 0) / 4294967296); };
const counts = s => [s.lizards.length, s.resources.filter(r => r.type === 'food').length, s.resources.filter(r => r.type === 'water').length, s.resources.filter(r => r.type === 'shelter').length];

test('starts ready with 10 lizards and 30 randomly typed resources in bounded positions', () => {
  const sim = createSimulation({ random: () => 0 });
  const s = sim.snapshot();
  assert.equal(s.status, 'ready');
  assert.deepEqual(counts(s), [10, 30, 0, 0]);
  assert.ok(s.lizards.every(l => l.need === 'food' && l.expiresAt === 10000));
  const entities = [...s.lizards, ...s.resources];
  assert.equal(new Set(entities.map(e => e.id)).size, 40);
  assert.ok(entities.every(e => e.x >= 0 && e.x <= 1 && e.y >= 0 && e.y <= 1));
  assert.deepEqual(s.history, [{timeMs: 0, lizards: 10, food: 30, water: 0, shelter: 0}]);
});

test('a match consumes one resource, replaces parent by two and cannot be repeated', () => {
  const sim = createSimulation({ random: () => 0 });
  sim.start(); sim.advance(2000);
  const s = sim.snapshot(), parent = s.lizards[0], food = s.resources.find(r => r.type === 'food');
  assert.deepEqual(sim.match(parent.id, food.id), {ok: true, reason: 'matched'});
  sim.advance(2000);
  const after = sim.snapshot();
  assert.deepEqual(counts(after), [11, 29, 0, 0]);
  assert.ok(!after.lizards.some(l => l.id === parent.id));
  const children = after.lizards.filter(l => l.bornAt === 4000);
  assert.equal(children.length, 2);
  assert.ok(children.every(l => l.expiresAt === 14000));
  assert.deepEqual(sim.match(parent.id, food.id), {ok: false, reason: 'missing-entity'});
  assert.deepEqual(sim.snapshot(), after);
});

test('wrong resource leaves the population and resource intact', () => {
  const sim = createSimulation({ random: seeded() }); sim.start();
  const s = sim.snapshot();
  assert.deepEqual(sim.match(s.lizards[0].id, s.resources.find(r => r.type !== s.lizards[0].need).id), {ok: false, reason: 'wrong-resource'});
  assert.deepEqual(sim.snapshot(), s);
});

test('ready and paused simulations reject matches and do not advance', () => {
  const sim = createSimulation(); const s = sim.snapshot();
  assert.equal(sim.match(s.lizards[0].id, s.resources[0].id).reason, 'not-running');
  sim.advance(5000); assert.equal(sim.snapshot().elapsedMs, 0);
  sim.start(); sim.advance(3000); sim.pause(); const paused = sim.snapshot();
  sim.advance(10000); assert.deepEqual(sim.snapshot(), paused);
  assert.equal(sim.match(paused.lizards[0].id, paused.resources[0].id).reason, 'not-running');
  sim.start(); sim.advance(1000); assert.equal(sim.snapshot().elapsedMs, 4000);
});

test('expiration happens exactly at ten seconds and ends at extinction', () => {
  const sim = createSimulation({random: () => 0}); sim.start();
  sim.advance(9999); assert.equal(sim.snapshot().lizards.length, 10);
  sim.advance(1); const s = sim.snapshot();
  assert.deepEqual(counts(s), [0, 40, 0, 0]);
  assert.equal(s.status, 'ended'); assert.equal(s.deaths.length, 10);
  assert.equal(s.history.at(-1).timeMs, 10000);
  assert.equal(s.history.at(-1).lizards, 0);
  sim.start(); sim.advance(4000); assert.equal(sim.snapshot().elapsedMs, 10000);
});

test('large time steps sample real states at second and death boundaries', () => {
  const sim = createSimulation({random: () => 0}); sim.start(); sim.advance(10000);
  const s = sim.snapshot(); assert.equal(s.elapsedMs, 10000);
  assert.equal(s.history.length, 11);
  assert.equal(s.history[9].lizards, 10); assert.equal(s.history[10].lizards, 0);
});

test('newborns get their own deadlines and resource types can include all categories', () => {
  const sim = createSimulation({random: seeded()}); sim.start(); sim.advance(1000);
  const s = sim.snapshot(), l = s.lizards[0];
  sim.match(l.id, s.resources.find(r => r.type === l.need).id);
  sim.advance(9000); const after = sim.snapshot();
  assert.equal(after.lizards.length, 2);
  assert.ok(after.lizards.every(l => l.expiresAt === 13000));
  assert.equal(after.resources.length, 38);
  sim.advance(3000); assert.equal(sim.snapshot().status, 'ended');
});

test('reset clears time/history and rejects stale IDs without reuse', () => {
  const sim = createSimulation({random: seeded()}); sim.start(); sim.advance(4000);
  const old = sim.snapshot(); sim.reset(); const fresh = sim.snapshot();
  assert.equal(fresh.status, 'ready'); assert.equal(fresh.elapsedMs, 0);
  assert.equal(fresh.lizards.length,10); assert.equal(fresh.resources.length,30);
  assert.equal(fresh.history.length, 1); assert.equal(fresh.deaths.length, 0);
  assert.ok(fresh.lizards.every(l => !old.lizards.some(o => o.id === l.id)));
  sim.start(); assert.equal(sim.match(old.lizards[0].id, old.resources[0].id).reason, 'missing-entity');
});

test('long calibration runs retain every reading from the start', () => {
  const sim = createSimulation({lifespanMs: 800000}); sim.start(); sim.advance(650000);
  const s = sim.snapshot(); assert.equal(s.status, 'running');
  assert.equal(s.lizards.length, 10); assert.equal(s.deaths.length, 0);
  assert.ok(s.lizards.every(l => l.expiresAt === 800000));
  assert.equal(s.history.length, 651);
  assert.equal(s.history[0].timeMs, 0);
  assert.equal(s.history.at(-1).timeMs, 650000);
});

test('finite calibration parameter keeps the exact configured deadline', () => {
  const sim = createSimulation({lifespanMs: 20000}); sim.start(); sim.advance(8000);
  assert.equal(sim.snapshot().lizards.length, 10);
  sim.advance(12000); assert.equal(sim.snapshot().lizards.length, 0);
});

test('history snapshots cannot be modified by a caller', () => {
  const sim = createSimulation({random:()=>0}); const s = sim.snapshot();
  s.lizards.length = 0; s.resources[0].type = 'invalid'; s.history[0].lizards = 999;
  assert.deepEqual(counts(sim.snapshot()), [10, 30, 0, 0]);
  assert.equal(sim.snapshot().history[0].lizards, 10);
});

test('mixed matches/deaths preserve total population plus resources', () => {
  const sim = createSimulation({random: seeded()}); sim.start();
  for (let i = 0; i < 160; i++) {
    const s = sim.snapshot();
    const l = s.lizards[i % Math.max(1, s.lizards.length)];
    if (l && i % 3 !== 0) {
      const r = s.resources.find(r => r.type === l.need); if (r) sim.match(l.id, r.id);
    }
    sim.advance(350);
    const after = sim.snapshot();
    assert.equal(after.lizards.length + after.resources.length + 2*after.pendingBirths.length, 40);
    assert.ok(after.history.every(h => h.lizards + h.food + h.water + h.shelter <= 40));
    assert.equal(new Set([...after.lizards, ...after.resources].map(e => e.id)).size, after.lizards.length + after.resources.length);
  }
});

test('invalid lifespans/time increments fail without poisoning state', () => {
  for (const value of [null, 0, -1, NaN, Infinity]) assert.throws(() => createSimulation({lifespanMs: value}), RangeError);
  const sim = createSimulation(); sim.start();
  for (const value of [-1, NaN, Infinity]) assert.throws(() => sim.advance(value), RangeError);
  assert.equal(sim.snapshot().elapsedMs, 0);
});


test('a nonterminal death updates the graph at its exact time', () => {
  const sim = createSimulation({random: () => 0});
  const feed = () => { const s=sim.snapshot(); sim.match(s.lizards[0].id, s.resources.find(r=>r.type==='food').id); };
  sim.start(); sim.advance(250); feed(); sim.advance(9850); feed(); sim.advance(2150);
  const s=sim.snapshot();
  assert.equal(s.lizards.length,2);
  assert.deepEqual(s.history.at(-1), {timeMs:12250,lizards:2,food:38,water:0,shelter:0});
});

