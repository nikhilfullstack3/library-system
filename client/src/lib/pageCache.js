// Module-level cache — survives component unmounts within the same browser session.
// Pages initialize state from cache so re-visiting a tab feels instant while the
// background refresh brings in fresh data.
const _cache = new Map();

export const pageCache = {
  get: (key) => _cache.get(key),
  set: (key, value) => _cache.set(key, value),
};
