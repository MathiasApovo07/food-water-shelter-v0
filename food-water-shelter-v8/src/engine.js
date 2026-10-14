(function (root) {
  'use strict';
  const TYPES = ['food', 'water', 'shelter'];

  function createSimulation({ random = Math.random, lifespanMs = 10000, drought = false, wildfire = false } = {}) {
    if (!Number.isFinite(lifespanMs) || lifespanMs <= 0) {
      throw new RangeError('The time limit must be positive and finite.');
    }
    let sequence = 0;
    let status, pauseReason, elapsedMs, lizards, resources, history, deaths, nextSample, nextFireMs, lastFire, fires, pendingBirths;
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
    const fireInterval = () => 15000 + value() * 15000;
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
      status = 'ready'; pauseReason = null; elapsedMs = 0; nextSample = 1000; deaths = []; history = []; fires = []; pendingBirths = [];
      lizards = Array.from({ length: 10 }, lizard);
      resources = Array.from({ length: 30 }, () => resource(resourceType()));
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
      if (lizards.length === 0 && pendingBirths.length === 0) status = 'ended';
      record();
    }
    function burn() {
      const shelters = resources.filter(r => r.type === 'shelter');
      // Odd counts round up; sample without replacement so every shelter is eligible.
      const removed = Math.ceil(shelters.length / 2);
      const burnedIds = new Set();
      for (let i = 0; i < removed; i++) {
        const j = i + Math.floor(value() * (shelters.length - i));
        [shelters[i], shelters[j]] = [shelters[j], shelters[i]];
        burnedIds.add(shelters[i].id);
      }
      resources = resources.filter(r => !burnedIds.has(r.id));
      lastFire = { timeMs: elapsedMs, removed, burned: shelters.filter(r => burnedIds.has(r.id)).map(r => ({...r})) }; fires.push(lastFire);
      nextFireMs = elapsedMs + fireInterval();
      status = 'paused'; pauseReason = 'wildfire';
      record();
    }
    function advance(deltaMs) {
      if (!Number.isFinite(deltaMs) || deltaMs < 0) throw new RangeError('Elapsed time must be finite and non-negative.');
      if (status !== 'running') return;
      const target = elapsedMs + deltaMs;
      if (!Number.isFinite(target)) throw new RangeError('Elapsed time overflow.');
      while (elapsedMs < target && status === 'running') {
        const deadline = Math.min(...lizards.map(l => l.expiresAt ?? Infinity));
        elapsedMs = Math.min(target, nextSample, deadline, nextFireMs ?? Infinity, ...pendingBirths.map(b => b.readyAt));
        const due = pendingBirths.filter(b => b.readyAt <= elapsedMs);
        pendingBirths = pendingBirths.filter(b => b.readyAt > elapsedMs);
        for (const birth of due) lizards.push(lizard(), lizard());
        if (due.length) record();
        expire();
        if (nextFireMs !== null && elapsedMs >= nextFireMs && status === 'running') burn();
        // Retain death events until Reset so delayed frames cannot lose signals.
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
      pendingBirths.push({parentId:l.id, resourceId:r.id, readyAt:elapsedMs + 2000});
      record();
      return { ok: true, reason: 'matched' };
    }
    function start() { if (status === 'ready' || status === 'paused') { status = 'running'; pauseReason = null; } }
    function pause() { if (status === 'running') { status = 'paused'; pauseReason = 'manual'; record(); } }
    function snapshot() {
      return { pendingBirths: pendingBirths.map(b => ({...b})), status, pauseReason, elapsedMs, lifespanMs, drought, wildfire, nextFireMs, lastFire: lastFire ? {...lastFire, burned: lastFire.burned.map(r => ({...r}))} : null,
        fires: fires.map(f => ({...f, burned: f.burned.map(r => ({...r}))})),
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
