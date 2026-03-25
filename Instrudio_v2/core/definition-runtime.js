/**
 * Instrudio SSOT Definition Runtime — Remote-First GitHub Loader
 *
 * Fetches instrument definitions from GitHub (raw.githubusercontent.com) first,
 * falls back to local paths when offline. Caches with a 5-minute TTL.
 * On version change, re-applies everything so a single push to the repo
 * propagates to every web page, plugin bridge, and mobile client.
 *
 * Changing the source requires modifying this file — definitions themselves
 * cannot redirect to a different origin.
 */
(function(){
  'use strict';

  // ── Remote source of truth ────────────────────────────────────
  var OWNER = 'GareBear99';
  var REPO  = 'Instrudio';
  var BRANCH = 'main';
  var PATH_PREFIX = 'Instrudio_v2';
  var REMOTE_BASE = 'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/' + BRANCH + '/' + PATH_PREFIX + '/';
  var LOCAL_DEF_PATH = 'instruments/definitions/';
  var MANIFEST_FILE  = 'core/v1-ssot-manifest.json';

  // ── Cache ─────────────────────────────────────────────────────
  var CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  var cache = {};   // id → {data, fetchedAt, version}
  var manifestCache = null;

  // ── Evaluation metrics ─────────────────────────────────────────
  var metrics = {
    fetchSource: 'none',         // 'remote' | 'local' | 'cache'
    fetchTimeMs: 0,              // time to fetch definition
    applyTimeMs: 0,              // time to apply definition to page
    totalLoadTimeMs: 0,          // fetch + apply
    updateCheckTimeMs: 0,        // time for version comparison round-trip
    definitionVersion: '0',
    definitionId: '',
    definitionSizeBytes: 0,
    remoteAvailable: false,
    lastUpdateCheck: 0,
    history: []                  // array of {timestamp, fetchMs, applyMs, source}
  };

  // ── Fetch helpers ─────────────────────────────────────────────
  function fetchJsonRemote(relPath) {
    var url = REMOTE_BASE + relPath;
    return fetch(url, {cache: 'no-store', mode: 'cors'})
      .then(function(res) { if (!res.ok) throw new Error(res.status); return res.json(); });
  }

  function fetchJsonLocal(relPath) {
    return fetch(relPath, {cache: 'no-store'})
      .then(function(res) { if (!res.ok) throw new Error(res.status); return res.json(); });
  }

  // Remote-first: try GitHub, fall back to local (instrumented)
  function fetchJson(relPath) {
    var t0 = performance.now();
    return fetchJsonRemote(relPath).then(function(data) {
      metrics.fetchSource = 'remote';
      metrics.remoteAvailable = true;
      metrics.fetchTimeMs = performance.now() - t0;
      return data;
    }).catch(function() {
      return fetchJsonLocal(relPath).then(function(data) {
        metrics.fetchSource = 'local';
        metrics.fetchTimeMs = performance.now() - t0;
        return data;
      });
    });
  }

  // ── Definition loader ─────────────────────────────────────────
  function loadDefinitionById(id, forceRefresh) {
    var entry = cache[id];
    if (entry && !forceRefresh && (Date.now() - entry.fetchedAt) < CACHE_TTL_MS) {
      return Promise.resolve(entry.data);
    }
    var relPath = LOCAL_DEF_PATH + id + '.json';
    return fetchJson(relPath).then(function(def) {
      cache[id] = {data: def, fetchedAt: Date.now(), version: def && def.version || '0'};
      return def;
    }).catch(function() {
      return entry ? entry.data : null;
    });
  }

  // ── Manifest loader ───────────────────────────────────────────
  function loadManifest(forceRefresh) {
    if (manifestCache && !forceRefresh && (Date.now() - manifestCache.fetchedAt) < CACHE_TTL_MS) {
      return Promise.resolve(manifestCache.data);
    }
    return fetchJson(MANIFEST_FILE).then(function(m) {
      manifestCache = {data: m, fetchedAt: Date.now()};
      return m;
    }).catch(function() {
      return manifestCache ? manifestCache.data : null;
    });
  }

  // ── Bridge matcher ────────────────────────────────────────────
  function findDefinitionForBridge(bridge) {
    if (!bridge) return Promise.resolve(null);
    if (bridge.ssotId) return loadDefinitionById(bridge.ssotId);
    return loadManifest().then(function(manifest) {
      var ids = manifest && manifest.singleSourceOfTruth &&
        (manifest.singleSourceOfTruth.allInstrumentDefinitions || manifest.singleSourceOfTruth.coreInstruments);
      if (!ids || !ids.length) return null;
      var chain = Promise.resolve(null);
      ids.forEach(function(id) {
        chain = chain.then(function(found) {
          if (found) return found;
          return loadDefinitionById(id).then(function(def) {
            if (def && (def.bridgeInstrument === bridge.instrument ||
                def.slug === bridge.instrument ||
                def.page === location.pathname.split('/').pop())) return def;
            return null;
          });
        });
      });
      return chain;
    }).catch(function() { return null; });
  }

  // ── Apply to page ─────────────────────────────────────────────
  function applyText(def) {
    if (def && def.pageTitle) document.title = def.pageTitle;
    var h1 = document.querySelector('h1');
    if (h1 && def && def.headline) h1.textContent = def.headline;
    var subtitle = document.querySelector('[data-ssot-subheadline]');
    if (subtitle && def && def.subheadline) subtitle.textContent = def.subheadline;
  }

  function applyBridge(def, bridge) {
    if (!def || !bridge) return;
    if (def.bridgeInstrument) bridge.instrument = def.bridgeInstrument;
    if (def.name) bridge.title = def.name;
    if (typeof def.minMidi === 'number') bridge.minMidi = def.minMidi;
    if (typeof def.maxMidi === 'number') bridge.maxMidi = def.maxMidi;
    if (def.autoplay && typeof def.autoplay.respectsManualTechnique === 'boolean') {
      bridge.respectManualTechnique = !!def.autoplay.respectsManualTechnique;
    }
    if (def.techniques) bridge.techniques = def.techniques.slice();
    bridge.ssotDefinition = def;
    bridge.getSSOTDefinition = function() { return def; };
  }

  function applyByBridge() {
    var bridge = window.InstrudioBridge;
    var t0 = performance.now();
    return findDefinitionForBridge(bridge).then(function(def) {
      if (!def) return null;
      var tApply = performance.now();
      applyText(def);
      applyBridge(def, bridge);
      document.documentElement.dataset.instrudioSsot = def.id;
      metrics.applyTimeMs = performance.now() - tApply;
      metrics.totalLoadTimeMs = performance.now() - t0;
      metrics.definitionVersion = def.version || '0';
      metrics.definitionId = def.id || '';
      metrics.definitionSizeBytes = JSON.stringify(def).length;
      metrics.history.push({
        timestamp: Date.now(),
        fetchMs: Math.round(metrics.fetchTimeMs * 100) / 100,
        applyMs: Math.round(metrics.applyTimeMs * 100) / 100,
        source: metrics.fetchSource
      });
      return def;
    });
  }

  // ── Update check (call on startup or periodically) ────────────
  function checkForUpdates() {
    var bridge = window.InstrudioBridge;
    if (!bridge || !bridge.ssotId) return Promise.resolve(false);
    var id = bridge.ssotId;
    var oldVersion = cache[id] && cache[id].version || '0';
    var t0 = performance.now();
    return loadDefinitionById(id, true).then(function(def) {
      metrics.updateCheckTimeMs = performance.now() - t0;
      metrics.lastUpdateCheck = Date.now();
      if (!def) return false;
      var newVersion = def.version || '0';
      if (newVersion !== oldVersion) {
        applyText(def);
        applyBridge(def, bridge);
        if (window.InstrudioMIDI && window.InstrudioMIDI.rebuildCCMap) {
          window.InstrudioMIDI.rebuildCCMap();
        }
        metrics.definitionVersion = newVersion;
        console.log('[SSOT] Updated ' + id + ': ' + oldVersion + ' → ' + newVersion + ' (' + Math.round(metrics.updateCheckTimeMs) + 'ms)');
        return true;
      }
      return false;
    }).catch(function() { return false; });
  }

  function getMetrics() { return JSON.parse(JSON.stringify(metrics)); }

  // ── Expose ────────────────────────────────────────────────────
  window.InstrudioSSOTRuntime = {
    loadDefinitionById: loadDefinitionById,
    findDefinitionForBridge: findDefinitionForBridge,
    applyByBridge: applyByBridge,
    checkForUpdates: checkForUpdates,
    loadManifest: loadManifest,
    getMetrics: getMetrics,
    REMOTE_BASE: REMOTE_BASE
  };
})();
