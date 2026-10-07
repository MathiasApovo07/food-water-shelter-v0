(function (root) {
  'use strict';
  function prepareSeries(history, { width = 640, height = 220 } = {}) {
    const keys = ['lizards', 'food', 'water', 'shelter'];
    const xMin = history[0]?.timeMs ?? 0;
    const xMax = Math.max(xMin + 1000, history.at(-1)?.timeMs ?? 1000);
    const yMax = history.reduce((max, row) => Math.max(max, ...keys.map(k => row[k])), 10);
    const paths = Object.fromEntries(keys.map(key => [key, history.map((row, i) => {
      const x = Math.round(((row.timeMs - xMin) / (xMax - xMin)) * width * 100) / 100;
      const y = Math.round((1 - row[key] / yMax) * height * 100) / 100;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ')]));
    return { paths, latestRows: history.map(r => ({ ...r })), xMin, xMax, yMax };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { prepareSeries };
  else root.FWSData = { prepareSeries };
})(typeof globalThis !== 'undefined' ? globalThis : this);
