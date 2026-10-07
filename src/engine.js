(function (root) {
  'use strict';
  const TYPES = ['food', 'water', 'shelter'];

  function createSimulation({ random = Math.random, lifespanMs = 8000, drought = false, wildfire = false } = {}) {
    if (!Number.isFinite(lifespanMs) || lifespanMs <= 0) {
      throw new RangeError('The time limit must be positive and finite.');
    }
    let sequence = 0;
    let status, elapsedMs, lizards, resources, history, deaths, nextSample, nextFireMs, lastFire;
    const value = () => {
      const n = random();
      if (!Number.isFinite(n) || n < 0 || n >= 1) throw new RangeError('Random values must be in [0, 1).');
      return n;
    };
    const type = () => TYPES[Math.floor(value() * 3)];
    const resourceType = () => {
      if (!drought) return type();
      const n = value();
      return n < .4 ? 'food' : n < .6 ? 'water' : 'shelter';
    };
    const fireInterval = () => 20000 + value() * 20000;
    const position = () => ({ x: value(), y: value() });
    const lizard = () => ({ id: 'l' + (++sequence), need: type(), ...position(), bornAt: elapsedMs,
      expiresAt: elapsedMs + lifespanMs });
    const resource = kind => ({ id: 'r' + (++sequence), type: kind, ...position() });
    const record = () => {
      const row = { timeMs: elapsedMs, lizards: lizards.length, food: 0, water: 0, shelter: 0 };
      resources.forEach(r => row[r.type]++);
      if (history.at(-1)?.timeMs === elapsedMs) history[history.length - 1] = row;
      else history.push(row);
    };
    function reset() {
      status = 'ready'; elapsedMs = 0; nextSample = 1000; deaths = []; history = [];
      lizards = Array.from({ length: 10 }, lizard);
      resources = TYPES.flatMap(kind => Array.from({ length: drought ? (kind === 'water' ? 6 : 12) : 10 }, () => resource(kind)));
      nextFireMs = wildfire ? fireInterval() : null; lastFire = null;
      record();
    }
    function expire() {
      const expired = lizards.filter(l => l.expiresAt !== null && l.expiresAt <= elapsedMs);
      if (!expired.length) return;
      const ids = new Set(expired.map(l => l.id));
      lizards = lizards.filter(l => !ids.has(l.id));
      for (const l of expired) {
        deaths.push({ id: l.id, x: l.x, y: l.y, timeMs: elapsedMs });
        resources.push(resource(resourceType()));
      }
      if (lizards.length === 0) status = 'ended';
      record();
    }
    function burn() {
      const removed = resources.filter(r => r.type === 'shelter').length;
      resources = resources.filter(r => r.type !== 'shelter');
      lastFire = { timeMs: elapsedMs, removed };
      nextFireMs = elapsedMs + fireInterval();
      record();
    }
    function advance(deltaMs) {
      if (!Number.isFinite(deltaMs) || deltaMs < 0) throw new RangeError('Elapsed time must be finite and non-negative.');
      if (status !== 'running') return;
      const target = elapsedMs + deltaMs;
      if (!Number.isFinite(target)) throw new RangeError('Elapsed time overflow.');
      while (elapsedMs < target && status === 'running') {
        const deadline = Math.min(...lizards.map(l => l.expiresAt ?? Infinity));
        elapsedMs = Math.min(target, nextSample, deadline, nextFireMs ?? Infinity);
        expire();
        if (nextFireMs !== null && elapsedMs >= nextFireMs && status === 'running') burn();
        deaths = deaths.filter(d => elapsedMs - d.timeMs < 1000);
        if (elapsedMs >= nextSample) { record(); nextSample += 1000; }
      }
    }
    function match(lizardId, resourceId) {
      if (status !== 'running') return { ok: false, reason: 'not-running' };
      expire();
      if (status !== 'running') return { ok: false, reason: 'not-running' };
      const l = lizards.find(l => l.id === lizardId), r = resources.find(r => r.id === resourceId);
      if (!l || !r) return { ok: false, reason: 'missing-entity' };
      if (l.need !== r.type) return { ok: false, reason: 'wrong-resource' };
      lizards = lizards.filter(item => item.id !== l.id);
      resources = resources.filter(item => item.id !== r.id);
      lizards.push(lizard(), lizard());
      record();
      return { ok: true, reason: 'matched' };
    }
    function start() { if (status === 'ready' || status === 'paused') status = 'running'; }
    function pause() { if (status === 'running') { status = 'paused'; record(); } }
    function snapshot() {
      return { status, elapsedMs, lifespanMs, drought, wildfire, nextFireMs, lastFire: lastFire ? {...lastFire} : null,
        lizards: lizards.map(l => ({ ...l })), resources: resources.map(r => ({ ...r })),
        history: history.map(row => ({ ...row })), deaths: deaths.map(d => ({ ...d })) };
    }
    reset();
    return { start, pause, reset, advance, match, snapshot };
  }
  const api = { createSimulation, TYPES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FWS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
