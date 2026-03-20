
(function(){
  const cache = new Map();
  const manifestPath = 'core/v1-ssot-manifest.json';

  async function fetchJson(path){
    const res = await fetch(path, {cache:'no-store'});
    if(!res.ok) throw new Error('Failed to load '+path);
    return await res.json();
  }

  async function loadDefinitionById(id){
    if(cache.has(id)) return cache.get(id);
    const p = fetchJson('instruments/definitions/'+id+'.json').catch(()=>null);
    cache.set(id, p);
    return await p;
  }

  async function findDefinitionForBridge(bridge){
    if(!bridge) return null;
    if(bridge.ssotId) return await loadDefinitionById(bridge.ssotId);
    try{
      const manifest = await fetchJson(manifestPath).catch(()=>null);
      const ids = manifest?.singleSourceOfTruth?.allInstrumentDefinitions || manifest?.singleSourceOfTruth?.coreInstruments;
      if(!ids?.length) return null;
      for(const id of ids){
        const def = await loadDefinitionById(id);
        if(def && (def.bridgeInstrument===bridge.instrument || def.slug===bridge.instrument || def.page===location.pathname.split('/').pop())) return def;
      }
    }catch{}
    return null;
  }

  function applyText(def){
    if(def?.pageTitle) document.title = def.pageTitle;
    const h1 = document.querySelector('h1');
    if(h1 && def?.headline) h1.textContent = def.headline;
    const h2 = document.querySelector('h2');
    if(h2 && def?.headline) h2.textContent = def.headline;
    const subtitle = document.querySelector('[data-ssot-subheadline]');
    if(subtitle && def?.subheadline) subtitle.textContent = def.subheadline;
  }

  function applyBridge(def, bridge){
    if(!def || !bridge) return;
    if(def.bridgeInstrument) bridge.instrument = def.bridgeInstrument;
    if(def.name) bridge.title = def.name;
    if(Number.isFinite(def.minMidi)) bridge.minMidi = def.minMidi;
    if(Number.isFinite(def.maxMidi)) bridge.maxMidi = def.maxMidi;
    if(def.autoplay && typeof def.autoplay.respectsManualTechnique === 'boolean'){
      bridge.respectManualTechnique = !!def.autoplay.respectsManualTechnique;
    }
    if(def.techniques) bridge.techniques = def.techniques.slice();
    bridge.ssotDefinition = def;
    bridge.getSSOTDefinition = () => def;
  }

  async function applyByBridge(){
    const bridge = window.InstrudioBridge;
    const def = await findDefinitionForBridge(bridge);
    if(!def) return null;
    applyText(def);
    applyBridge(def, bridge);
    document.documentElement.dataset.instrudioSsot = def.id;
    return def;
  }

  window.InstrudioSSOTRuntime = {
    loadDefinitionById,
    findDefinitionForBridge,
    applyByBridge
  };
})();
