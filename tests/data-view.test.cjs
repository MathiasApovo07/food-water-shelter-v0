'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareSeries } = require('../src/data-view.js');
test('empty data and a single zero-population point have finite graph coordinates', () => {
  const empty = prepareSeries([]); assert.equal(empty.paths.lizards, '');
  const one = prepareSeries([{timeMs: 0, lizards: 0, food: 20, water: 10, shelter: 10}]);
  for (const path of Object.values(one.paths)) assert.ok(!/NaN|Infinity/.test(path));
  assert.ok(one.xMax > 0 && one.yMax >= 20);
});
test('two real samples produce hand-calculated coordinates for each series', () => {
  const result = prepareSeries([
    {timeMs: 0, lizards: 10, food: 10, water: 10, shelter: 10},
    {timeMs: 1000, lizards: 20, food: 0, water: 10, shelter: 10}
  ], {width: 100, height: 100});
  assert.equal(result.yMax, 20); assert.equal(result.xMax, 1000);
  assert.equal(result.paths.lizards, 'M0,50 L100,0');
  assert.equal(result.paths.food, 'M0,50 L100,100');
  assert.equal(result.paths.water, 'M0,50 L100,50');
});
test('all session readings remain available to the table', () => {
  const rows = Array.from({length: 20}, (_, i) => ({timeMs: (i + 600)*1000, lizards: 10, food: 10, water: 10, shelter: 10}));
  const result = prepareSeries(rows);
  assert.equal(result.latestRows.length, 20);
  assert.equal(result.latestRows[0].timeMs, 600000);
  assert.equal(result.latestRows.at(-1).timeMs, 619000);
  assert.ok(result.paths.lizards.startsWith('M0,'));
  assert.ok(result.paths.lizards.endsWith('L640,0'));
});
