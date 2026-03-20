
(() => {
  const STORAGE_KEY = 'instrudio-suite-pending-v2';
  const INSTRUDIO_VERSION = 'v2.7.0';
  const NOTE_INDEX = {C:0,'C#':1,DB:1,D:2,'D#':3,EB:3,E:4,F:5,'F#':6,GB:6,G:7,'G#':8,AB:8,A:9,'A#':10,BB:10,B:11};
  const INSTRUMENTS = {
    guitar:{label:'Guitar', page:'guitar.html'},
    harp:{label:'Celestial Harp', page:'harp.html'},
    piano:{label:'Studio Grand', page:'piano.html'},
    violin:{label:'Studio Violin', page:'violin.html'},
    bongo:{label:'Studio Bongos', page:'bongo.html'},
    saxophone:{label:'Saxophone', page:'saxophone.html'},
    accordion:{label:'Accordion', page:'accordion.html'},
    harmonica:{label:'Harmonica', page:'harmonica.html'},
    bagpipes:{label:'Bagpipes', page:'bagpipes.html'},
    triangle:{label:'Triangle', page:'triangle.html'}
  };
  const INSTRUMENT_PAGES = Object.fromEntries(Object.entries(INSTRUMENTS).map(([key, value]) => [key, value.page]));
  const SONG_LIBRARY = {
    ode_to_joy:{title:'Ode to Joy',tempo:104,body:'E4/1 E4/1 F4/1 G4/1 | G4/1 F4/1 E4/1 D4/1 | C4/1 C4/1 D4/1 E4/1 | E4/1.5 D4/0.5 D4/2 | E4/1 E4/1 F4/1 G4/1 | G4/1 F4/1 E4/1 D4/1 | C4/1 C4/1 D4/1 E4/1 | D4/1.5 C4/0.5 C4/2', arrangements:{ violin:{transpose:7,technique:'bow'}, saxophone:{transpose:2,technique:'legato'}, bongo:{technique:'open'} }},
    fur_elise:{title:'Für Elise',tempo:112,body:'E5/0.5 D#5/0.5 E5/0.5 D#5/0.5 E5/0.5 B4/0.5 D5/0.5 C5/0.5 A4/1 | C4/0.5 E4/0.5 A4/0.5 B4/1 | E4/0.5 G#4/0.5 B4/0.5 C5/1 | E4/0.5 E5/0.5 D#5/0.5 E5/0.5 D#5/0.5 E5/0.5 B4/0.5 D5/0.5 C5/0.5 A4/1', arrangements:{ violin:{transpose:0,technique:'pizz'}, saxophone:{transpose:-1,technique:'legato'}, guitar:{transpose:-12}, bongo:{technique:'mute'} }},
    canon_in_d:{title:'Canon in D',tempo:92,body:'F#4/1 E4/1 D4/1 C#4/1 | B3/1 A3/1 B3/1 C#4/1 | D4/1 F#4/1 A4/1 F#4/1 | G4/1 F#4/1 E4/1 D4/1 | F#4/1 E4/1 D4/1 C#4/1 | B3/1 A3/1 B3/1 C#4/1 | D4/1 A3/1 B3/1 G3/1 | A3/2 D4/2', arrangements:{ harp:{transpose:0}, violin:{transpose:12,technique:'bow'}, saxophone:{transpose:2,technique:'legato'}, bongo:{technique:'open'} }},
    swan_lake:{title:'Swan Lake Theme',tempo:84,body:'B4/1 D5/1 F#5/2 | E5/1 D5/1 C#5/2 | B4/1 D5/1 F#5/2 | E5/1 D5/1 C#5/2 | B4/1 A4/1 G4/1 F#4/1 | E4/2 F#4/2 | B4/1 D5/1 F#5/2 | E5/1 D5/1 C#5/2', arrangements:{ violin:{transpose:0,technique:'bow'}, saxophone:{transpose:-10,technique:'legato'}, piano:{transpose:0}, bongo:{technique:'slap'} }},
    minuet_in_g:{title:'Minuet in G',tempo:96,body:'D5/1 G4/1 A4/1 B4/1 | C5/1 D5/1 G4/2 | G4/1 C5/1 B4/1 A4/1 | B4/1 C5/1 D5/2 | D5/1 G4/1 A4/1 B4/1 | C5/1 D5/1 G4/2 | D5/1 E5/1 D5/1 C5/1 | B4/1 A4/1 G4/2', arrangements:{ guitar:{transpose:-12}, harp:{transpose:0}, violin:{transpose:7,technique:'pizz'}, saxophone:{transpose:2,technique:'staccato'}, bongo:{technique:'open'} }}
  };

  function esc(s){return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function noteNameToMidi(name){ const m=/^([A-Ga-g])([#b]?)(-?\d+)$/.exec(String(name).trim()); if(!m) return null; const idx=NOTE_INDEX[(m[1].toUpperCase()+(m[2]||'')).toUpperCase()]; if(idx==null) return null; return (parseInt(m[3],10)+1)*12+idx; }
  function clampMidiToRange(midi, bridge){ let n=Math.round(midi); const min=bridge.minMidi ?? 36, max=bridge.maxMidi ?? 96; while(n<min) n+=12; while(n>max) n-=12; return Math.min(max, Math.max(min, n)); }
  function cloneEvents(events){ return events.map(ev=>({at:ev.at,duration:ev.duration,notes:(ev.notes||[]).slice(),rest:!!ev.rest})); }
  function parseTokenPitch(raw){ if(!raw) return null; if(/^r(est)?$/i.test(raw.trim())) return 'REST'; return noteNameToMidi(raw.trim()); }
  function parseNoteText(text){ const sanitized=String(text).replace(/\r/g,' ').replace(/[|,]/g,' ').replace(/\s+/g,' ').trim(); if(!sanitized) throw new Error('No note data found.'); const tokens=sanitized.split(' '); const events=[]; let cursor=0; for(const token of tokens){ const [pitchPart,durPart='1']=token.split('/'); const duration=Math.max(.125, parseFloat(durPart)||1); const pitch=parseTokenPitch(pitchPart); if(pitch==='REST'){ cursor+=duration; continue; } if(pitch==null) continue; events.push({at:cursor,duration,notes:[pitch]}); cursor+=duration; } if(!events.length) throw new Error('Could not parse any notes from the text.'); return {events, tempo:96, source:'Note text'}; }
  function parseMusicXML(text){ const xml=new DOMParser().parseFromString(text,'application/xml'); if(xml.querySelector('parsererror')) throw new Error('This MusicXML file could not be parsed.'); const parts=[...xml.querySelectorAll('part')]; if(!parts.length) throw new Error('No parts found in this MusicXML file.'); const title=xml.querySelector('work > work-title, movement-title, credit-words')?.textContent?.trim() || 'MusicXML import'; const events=[]; let foundTempo=96; parts.forEach(part=>{ let cursor=0, divisions=1, last=null; [...part.querySelectorAll(':scope > measure')].forEach(measure=>{ [...measure.children].forEach(child=>{ const tag=child.tagName; if(tag==='attributes'){ const div=child.querySelector('divisions')?.textContent; if(div) divisions=Math.max(1, parseInt(div,10)||1); }
      else if(tag==='direction'){ const t=child.querySelector('sound')?.getAttribute('tempo') || child.querySelector('metronome per-minute')?.textContent; if(t) foundTempo=parseFloat(t)||foundTempo; }
      else if(tag==='backup'){ cursor=Math.max(0, cursor - ((parseInt(child.querySelector('duration')?.textContent||'0',10))/divisions)); }
      else if(tag==='forward'){ cursor += ((parseInt(child.querySelector('duration')?.textContent||'0',10))/divisions); }
      else if(tag==='note'){ const duration=Math.max(.125, (parseInt(child.querySelector('duration')?.textContent||String(divisions),10))/divisions); const isRest=!!child.querySelector('rest'); const isChord=!!child.querySelector('chord'); if(isRest){ if(!isChord) cursor+=duration; return; } const step=child.querySelector('pitch > step')?.textContent||'C'; const alter=parseInt(child.querySelector('pitch > alter')?.textContent||'0',10); const octave=parseInt(child.querySelector('pitch > octave')?.textContent||'4',10); const pitchName = step + (alter===1?'#':alter===-1?'b':'') + octave; const midi=noteNameToMidi(pitchName); if(midi==null) return; if(isChord && last && Math.abs(last.at-cursor)<1e-6){ last.notes.push(midi); last.duration=Math.max(last.duration,duration); } else { last={at:cursor,duration,notes:[midi]}; events.push(last); } if(!isChord) cursor+=duration; }
    }); }); }); if(!events.length) throw new Error('No playable notes were found in this MusicXML file.'); return {events, tempo:foundTempo, source:title}; }
  function parseByExtension(name, content){ const lower=String(name).toLowerCase(); if(lower.endsWith('.musicxml')||lower.endsWith('.xml')) return parseMusicXML(content); if(lower.endsWith('.txt')||lower.endsWith('.notes')) return parseNoteText(content); throw new Error('Unsupported file type. Use .musicxml/.xml or .txt/.notes'); }
  function makeSongEvents(songId){ const song=SONG_LIBRARY[songId]; if(!song) throw new Error('Unknown song selection.'); const parsed=parseNoteText(song.body); parsed.tempo=song.tempo; parsed.source=song.title; return parsed; }
  function buildPayload(kind,instrument,parsed,songId,extras={}){ return {kind,instrument,tempo:parsed.tempo||96,source:parsed.source||'Instrudio import',songId:songId||null,createdAt:Date.now(),transpose:extras.transpose||0,loop:!!extras.loop,events:cloneEvents(parsed.events)}; }
  function savePending(payload){ localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); }
  function loadPending(){ try{ const raw=localStorage.getItem(STORAGE_KEY); return raw?JSON.parse(raw):null; }catch{return null;} }
  function clearPending(){ localStorage.removeItem(STORAGE_KEY); }

  function showRuntimeMessage(message, isError=false){
    let box=document.getElementById('instrudio-runtime-toast');
    if(!box){
      box=document.createElement('div');
      box.id='instrudio-runtime-toast';
      box.className='instrudio-runtime-toast';
      document.body.appendChild(box);
    }
    box.textContent=message;
    box.classList.toggle('is-error', !!isError);
    box.classList.add('open');
    clearTimeout(showRuntimeMessage._timer);
    showRuntimeMessage._timer=setTimeout(()=>box.classList.remove('open'), isError?5200:2600);
  }
  function installGlobalErrorHandling(){
    if(window.__instrudioErrorsInstalled) return;
    window.__instrudioErrorsInstalled=true;
    window.addEventListener('error', e=>{
      if(!e?.message) return;
      console.error('Instrudio runtime error:', e.message);
      showRuntimeMessage('Instrudio error: '+e.message, true);
    });
    window.addEventListener('unhandledrejection', e=>{
      const msg=e?.reason?.message || e?.reason || 'Unexpected async failure.';
      console.error('Instrudio async error:', msg);
      showRuntimeMessage('Instrudio error: '+msg, true);
    });
  }
  function unlockPageAudio(){
    if(window.__instrudioAudioUnlockBound) return;
    window.__instrudioAudioUnlockBound=true;
    const tryResume=()=>{
      try{
        const Ctx=window.AudioContext||window.webkitAudioContext;
        if(Ctx && Ctx.prototype && Ctx.prototype.resume){
          const contexts=(window.__instrudioKnownAudioContexts||[]);
          contexts.forEach(ctx=>{ try{ if(ctx && ctx.state==='suspended') ctx.resume(); }catch{} });
        }
      }catch{}
    };
    ['pointerdown','touchstart','keydown','click'].forEach(evt=>document.addEventListener(evt, tryResume, {passive:true}));
  }
  function registerAudioContext(ctx){
    window.__instrudioKnownAudioContexts = window.__instrudioKnownAudioContexts || [];
    if(ctx && !window.__instrudioKnownAudioContexts.includes(ctx)) window.__instrudioKnownAudioContexts.push(ctx);
  }

  function wireInfoOverlay(){
    const overlay=document.getElementById('infoOverlay');
    if(!overlay || overlay.dataset.instrudioWired==='1') return;
    overlay.dataset.instrudioWired='1';
    overlay.setAttribute('aria-hidden', overlay.classList.contains('open') ? 'false' : 'true');
    const sync=()=>overlay.setAttribute('aria-hidden', overlay.classList.contains('open') ? 'false' : 'true');
    const open=()=>{ overlay.classList.add('open'); sync(); };
    const close=()=>{ overlay.classList.remove('open'); sync(); };
    overlay.addEventListener('click', e=>{ if(e.target===overlay) close(); });
    document.addEventListener('keydown', e=>{ if(e.key==='Escape') close(); });
    overlay.querySelectorAll('[onclick*="infoOverlay"]').forEach(el=>{
      const raw=el.getAttribute('onclick')||'';
      if(raw.includes("classList.add('open')") || raw.includes('classList.add("open")')) el.onclick=open;
      if(raw.includes("classList.remove('open')") || raw.includes('classList.remove("open")')) el.onclick=close;
    });
  }
  function installKeyboardShortcuts(){
    if(window.__instrudioKeysInstalled) return;
    window.__instrudioKeysInstalled=true;
    document.addEventListener('keydown', e=>{
      const t=e.target;
      const tag=t?.tagName;
      if(tag==='INPUT' || tag==='TEXTAREA' || t?.isContentEditable) return;
      if(e.key===' '){
        const play=document.getElementById('is-play-song') || document.getElementById('ih-launch-song');
        if(play){ e.preventDefault(); play.click(); }
      } else if((e.key||'').toLowerCase()==='s'){
        const stop=document.getElementById('is-stop-song');
        if(stop){ e.preventDefault(); stop.click(); }
      }
    });
  }
  function parseInput(name, content){
    const raw=String(content||'');
    if(!raw.trim()) throw new Error('Empty score. Add MusicXML or note text first.');
    const lower=String(name||'').toLowerCase();
    if(raw.includes('<score-partwise') || raw.includes('<score-timewise') || lower.endsWith('.musicxml') || lower.endsWith('.xml')) return parseMusicXML(raw);
    return parseNoteText(raw);
  }
  function ensureInfoButton(){
    if(location.pathname.split('/').pop()==='index.html') return;
    if(document.querySelector('.info-btn') || !document.getElementById('infoOverlay')) return;
    const header=document.querySelector('header');
    if(!header) return;
    header.style.position=header.style.position||'relative';
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='info-btn';
    btn.setAttribute('aria-label','Open instrument info');
    btn.title='Instrument info';
    btn.textContent='ℹ';
    btn.addEventListener('click', ()=>document.getElementById('infoOverlay')?.classList.add('open'));
    header.appendChild(btn);
  }
  function addVersionBadge(){
    const badge=document.querySelector('.badge');
    if(badge && !badge.textContent.includes(INSTRUDIO_VERSION)) badge.textContent += ' · '+INSTRUDIO_VERSION;
    const foot=document.querySelector('.foot-card p');
    if(foot && !foot.textContent.includes(INSTRUDIO_VERSION)) foot.innerHTML += ' <br><strong>Release:</strong> '+INSTRUDIO_VERSION;
  }

  const playerStatee={timeouts:[], active:false, durationMs:0, startedAt:0, payload:null, bridge:null, onProgress:null, loop:false, noteIndex:-1};
  function stopPlayback(){ playerStatee.timeouts.forEach(clearTimeout); playerStatee.timeouts=[]; playerStatee.active=false; playerStatee.durationMs=0; playerStatee.startedAt=0; playerStatee.noteIndex=-1; playerStatee.bridge?.stopAll?.(); playerStatee.onProgress?.(0, null, true); }
  function schedulePlayback(payload, bridge, onProgress){ stopPlayback(); const tempo=Math.max(40, Math.min(220, parseFloat(payload.tempo)||96)); const beatMs=60000/tempo; const inst=bridge.instrument || payload.instrument || 'piano'; const songMeta=payload.songId ? SONG_LIBRARY[payload.songId] : null; const settings=songMeta?.arrangements?.[inst] || {}; const transpose=(parseInt(payload.transpose||0,10)||0)+(parseInt(settings.transpose||0,10)||0); const requestedTechnique=settings.technique || null; const technique=bridge?.resolveAutoplayTechnique ? bridge.resolveAutoplayTechnique(requestedTechnique, settings, payload) : ((bridge?.respectManualTechnique && bridge?.getTechnique) ? (bridge.getTechnique() || requestedTechnique) : requestedTechnique); if(bridge.init) bridge.init(); if(bridge.setTechnique && technique && (!bridge?.respectManualTechnique || bridge?.allowTechniqueSwitchOnAutoplay)) bridge.setTechnique(technique, {source:'autoplay'});
    const events=payload.events.map(ev=>({at:ev.at,duration:ev.duration,notes:(ev.notes||[]).map(n=>clampMidiToRange(n+transpose,bridge)), rest:!!ev.rest}));
    const durationMs=events.reduce((m,ev)=>Math.max(m,(ev.at+ev.duration)*beatMs),0);
    playerStatee.active=true; playerStatee.durationMs=durationMs; playerStatee.startedAt=performance.now(); playerStatee.payload=payload; playerStatee.bridge=bridge; playerStatee.onProgress=onProgress; playerStatee.loop=!!payload.loop;
    events.forEach((ev,idx)=>{ if(ev.rest||!ev.notes?.length) return; playerStatee.timeouts.push(setTimeout(()=>{ playerStatee.noteIndex=idx; onProgress?.((performance.now()-playerStatee.startedAt)/durationMs, idx, false); ev.notes.forEach((midi,i)=>bridge.playMidi(midi, Math.max(0.35,0.88-i*0.12), ev.duration*beatMs, {technique})); }, ev.at*beatMs)); });
    const tick=()=>{ if(!playerStatee.active) return; const pct=Math.min(1,(performance.now()-playerStatee.startedAt)/durationMs); onProgress?.(pct, playerStatee.noteIndex, false); if(pct<1) playerStatee.timeouts.push(setTimeout(tick, 80)); };
    tick();
    playerStatee.timeouts.push(setTimeout(()=>{ bridge.stopAll?.(); onProgress?.(1, null, true); if(payload.loop){ schedulePlayback(payload, bridge, onProgress); } else { playerStatee.active=false; } }, durationMs+140));
    return durationMs;
  }

  function styleText(){ return `
    .instrudio-home-shell{margin:16px 0 22px;padding:22px;border:1px solid rgba(160,190,255,.14);border-radius:26px;background:linear-gradient(180deg,rgba(14,20,36,.86),rgba(9,14,28,.86));box-shadow:0 18px 60px rgba(0,0,0,.34)}
    .instrudio-home-shell h3{font:800 clamp(20px,3vw,32px)/1.1 system-ui,sans-serif;letter-spacing:.05em;margin:0 0 8px}
    .instrudio-home-shell p{color:#d7e0f4;line-height:1.7;font-size:15px;margin:0 0 14px}
    .instrudio-home-grid,.instrudio-suite-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    .instrudio-home-card,.instrudio-embedded-score-dock{padding:16px;border-radius:18px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(10,16,28,.90),rgba(8,12,22,.92));box-shadow:0 12px 38px rgba(0,0,0,.28)}
    .instrudio-suite-shell{margin:18px auto 0;max-width:1100px;width:min(1100px,calc(100% - 28px));color:#edf4ff}
    .instrudio-console-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.06);margin-bottom:12px}
    .instrudio-console-head b{font:800 13px/1.2 system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#ffd88a}
    .instrudio-console-head span{font:500 11px/1.35 system-ui,sans-serif;color:#9fb2d4;letter-spacing:.08em}
    .instrudio-suite-grid{grid-template-columns:1.2fr .6fr .6fr}
    .instrudio-suite-field{display:grid;gap:6px}
    .instrudio-suite-field label{font:700 10px/1.1 system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#8ca0c8}
    .instrudio-home-shell select,.instrudio-home-shell input,.instrudio-home-shell textarea,.instrudio-embedded-score-dock select,.instrudio-embedded-score-dock input,.instrudio-embedded-score-dock textarea{width:100%;padding:11px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:#edf4ff;font:500 13px/1.4 system-ui,sans-serif;outline:none}
    .instrudio-home-shell textarea,.instrudio-embedded-score-dock textarea{min-height:82px;resize:vertical}
    .instrudio-suite-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:2px}
    .instrudio-suite-btn{appearance:none;border:none;cursor:pointer;border-radius:12px;padding:11px 14px;font:700 13px/1 system-ui,sans-serif;letter-spacing:.02em}
    .instrudio-suite-btn.primary{background:linear-gradient(135deg,#74b6ff,#d2e8ff);color:#07111f}
    .instrudio-suite-btn.secondary{background:rgba(255,255,255,.06);color:#edf4ff;border:1px solid rgba(255,255,255,.08)}
    .instrudio-suite-home{display:block;text-decoration:none;color:#edf4ff;text-align:center;padding:11px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);font:600 12px/1 system-ui,sans-serif}
    .instrudio-progress{height:9px;border-radius:999px;background:rgba(255,255,255,.06);overflow:hidden;border:1px solid rgba(255,255,255,.05);margin-top:2px}
    .instrudio-progress>i{display:block;height:100%;width:0%;background:linear-gradient(90deg,#74b6ff,#ffd88a);transition:width .09s linear}
    .instrudio-dropzone{display:grid;place-items:center;min-height:82px;border-radius:16px;border:1px dashed rgba(255,216,138,.30);background:rgba(255,255,255,.02);color:#d9e4ff;text-align:center;padding:12px;font:600 13px/1.5 system-ui,sans-serif}
    .instrudio-dropzone.is-over{border-color:#ffd88a;background:rgba(255,216,138,.08);box-shadow:inset 0 0 0 1px rgba(255,216,138,.22)}
    .instrudio-timeline{display:flex;gap:6px;flex-wrap:wrap;min-height:30px}
    .instrudio-pill{padding:4px 9px;border-radius:999px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);font:700 11px/1.1 system-ui,sans-serif;color:#9fb2d4}
    .instrudio-pill.active{color:#07111f;background:linear-gradient(135deg,#ffd88a,#fff0c8);border-color:rgba(255,216,138,.7)}
    .instrudio-suite-msg{font:500 12px/1.5 system-ui,sans-serif;color:#9effc8;min-height:18px}
    .instrudio-suite-note{font:500 11px/1.55 system-ui,sans-serif;color:#94a7c8}
    .instrudio-loop{display:flex;align-items:center;gap:8px;color:#cbd8f5;font:600 12px/1.1 system-ui,sans-serif}
    .instrudio-runtime-toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%) translateY(12px);min-width:min(680px,calc(100% - 24px));max-width:min(680px,calc(100% - 24px));padding:12px 14px;border-radius:14px;background:rgba(11,17,30,.94);border:1px solid rgba(158,255,200,.18);box-shadow:0 16px 40px rgba(0,0,0,.35);color:#dfffee;font:600 13px/1.45 system-ui,sans-serif;opacity:0;pointer-events:none;transition:opacity .18s ease,transform .18s ease;z-index:9999}
    .instrudio-runtime-toast.open{opacity:1;transform:translateX(-50%) translateY(0)}
    .instrudio-runtime-toast.is-error{color:#ffe1e1;border-color:rgba(255,132,132,.28)}
    .instrudio-input-ok{border-color:rgba(158,255,200,.35)!important;box-shadow:0 0 0 1px rgba(158,255,200,.15) inset}
    .instrudio-input-bad{border-color:rgba(255,132,132,.38)!important;box-shadow:0 0 0 1px rgba(255,132,132,.18) inset}
    @media (max-width:960px){.instrudio-suite-actions{flex-direction:column;align-items:stretch}.instrudio-suite-btn,.instrudio-suite-home{width:100%}}
    @media (max-width:760px){.instrudio-home-grid,.instrudio-suite-grid{grid-template-columns:1fr}.instrudio-suite-shell{width:calc(100% - 20px)}.instrudio-home-card,.instrudio-embedded-score-dock,.instrudio-home-shell{padding:14px}.instrudio-home-shell textarea,.instrudio-embedded-score-dock textarea{min-height:120px}.instrudio-dropzone{min-height:110px}}
  `; }
  function ensureStyle(){ if(document.getElementById('instrudio-suite-style')) return; const st=document.createElement('style'); st.id='instrudio-suite-style'; st.textContent=styleText(); document.head.appendChild(st); }
  function songOptionsHtml(){ return Object.entries(SONG_LIBRARY).map(([id,s])=>`<option value="${id}">${esc(s.title)}</option>`).join(''); }
  function instrumentOptionsHtml(selected){ return Object.entries(INSTRUMENTS).map(([k, meta])=>`<option value="${k}"${k===selected?' selected':''}>${esc(meta.label)}</option>`).join(''); }
  function pillsFromEvents(events, max=18){ return events.slice(0,max).map((ev,i)=>`<span class="instrudio-pill" data-idx="${i}">${esc((ev.notes||[]).map(m=>midiToName(m)).join('/'))}</span>`).join(''); }
  function midiToName(m){ const names=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']; return names[((m%12)+12)%12]+(Math.floor(m/12)-1); }

  function mountHomeConsole(){ ensureStyle(); const wrap=document.querySelector('.wrap'); if(!wrap || document.getElementById('instrudio-home-console')) return; const shell=document.createElement('section'); shell.className='instrudio-home-shell'; shell.id='instrudio-home-console'; shell.innerHTML=`<h3>Score Console</h3><p>Launch any instrument with a built-in classical piece, or import your own score as <strong>MusicXML</strong> or simple note text.</p><div class="instrudio-home-grid"><div class="instrudio-home-card"><div class="instrudio-suite-field"><label for="ih-instrument">Instrument</label><select id="ih-instrument" aria-label="Choose an instrument">${instrumentOptionsHtml('piano')}</select></div><div class="instrudio-suite-field"><label for="ih-song">Song</label><select id="ih-song" aria-label="Choose a built-in song">${songOptionsHtml()}</select></div><div class="instrudio-suite-actions"><button class="instrudio-suite-btn primary" id="ih-launch-song" aria-label="Launch selected built-in song">Launch with song</button></div></div><div class="instrudio-home-card"><div class="instrudio-suite-field"><label for="ih-file">MusicXML or note text file</label><input type="file" id="ih-file" accept=".musicxml,.xml,.txt,.notes" aria-label="Import a MusicXML or note text file"></div><div class="instrudio-suite-field"><label for="ih-text">Or paste note text</label><textarea id="ih-text" placeholder="Example: E4/1 F#4/0.5 G4/2 R/1" aria-label="Paste note text here"></textarea></div><div class="instrudio-suite-actions"><button class="instrudio-suite-btn secondary" id="ih-launch-import" aria-label="Launch imported score">Launch imported score</button></div></div></div><div class="instrudio-suite-note">Built-in songs: ${Object.values(SONG_LIBRARY).map(s=>s.title).join(' · ')} · Release ${INSTRUDIO_VERSION} · Shortcut: Space = play, S = stop</div><div class="instrudio-suite-msg" id="ih-msg" role="status" aria-live="polite"></div>`; const foot=document.querySelector('.foot-card'); if(foot) wrap.insertBefore(shell, foot); else wrap.appendChild(shell);
    const msg=shell.querySelector('#ih-msg'); const setMsg=(t,ok=true)=>{msg.textContent=t; msg.style.color=ok?'#9effc8':'#ffb8b8'; if(t) showRuntimeMessage(t,!ok);};
    shell.querySelector('#ih-launch-song').onclick=()=>{ try{ const instrument=shell.querySelector('#ih-instrument').value; const songId=shell.querySelector('#ih-song').value; savePending(buildPayload('song', instrument, makeSongEvents(songId), songId)); location.href=INSTRUMENT_PAGES[instrument]; } catch(err){ setMsg(err.message,false); } };
    shell.querySelector('#ih-launch-import').onclick=async()=>{ try{ const instrument=shell.querySelector('#ih-instrument').value; const file=shell.querySelector('#ih-file').files[0]; const pasted=shell.querySelector('#ih-text').value.trim(); let parsed; if(file) parsed=parseInput(file.name, await file.text()); else if(pasted) parsed=parseInput('pasted.notes', pasted); else throw new Error('Choose a file or paste note text first.'); setMsg('Import validated. Opening '+INSTRUMENTS[instrument].label+'…'); savePending(buildPayload('import', instrument, parsed, null)); location.href=INSTRUMENT_PAGES[instrument]; } catch(err){ setMsg(err.message,false); showRuntimeMessage(err.message,true);} };
  }

  function mountInstrumentPanel(bridge){ ensureStyle(); let host=document.getElementById('instrudio-embedded-score-dock'); if(!host){ host=document.createElement('section'); host.id='instrudio-embedded-score-dock'; document.body.appendChild(host); }
    if(host.dataset.mounted==='1') return; host.dataset.mounted='1'; host.classList.add('instrudio-embedded-score-dock','instrudio-suite-shell');
    host.innerHTML=`<div class="instrudio-console-head"><div><b>Instrudio Score Dock</b><span>${esc(bridge.title || bridge.instrument || 'Instrument')} · ${INSTRUDIO_VERSION}</span></div><span>silent shared engine</span></div><div class="instrudio-suite-grid"><div class="instrudio-suite-field"><label for="is-song">Song select</label><select id="is-song" aria-label="Choose a built-in song">${songOptionsHtml()}</select></div><div class="instrudio-suite-field"><label for="is-tempo">Tempo</label><input id="is-tempo" type="number" min="40" max="220" step="1" value="96" aria-label="Playback tempo"></div><div class="instrudio-suite-field"><label for="is-transpose">Transpose</label><input id="is-transpose" type="number" min="-24" max="24" step="1" value="0" aria-label="Transpose notes"></div></div><div class="instrudio-suite-actions"><button class="instrudio-suite-btn primary" id="is-play-song" aria-label="Autoplay selected song">Autoplay song</button><button class="instrudio-suite-btn secondary" id="is-stop-song" aria-label="Stop playback">Stop</button><label class="instrudio-loop"><input id="is-loop" type="checkbox"> Loop</label><a class="instrudio-suite-home" href="index.html">Back to homepage</a></div><div class="instrudio-progress"><i id="is-progress-fill"></i></div><div class="instrudio-suite-field"><label>Upcoming notes</label><div class="instrudio-timeline" id="is-timeline"></div></div><div class="instrudio-suite-field"><label for="is-dropzone">Drop a score here</label><div class="instrudio-dropzone" id="is-dropzone" tabindex="0" aria-label="Drag and drop MusicXML or note text here"><strong>Drag & drop MusicXML or note-text here</strong><span>Built into this instrument page. The shared engine runs silently underneath.</span></div></div><div class="instrudio-suite-field"><label for="is-file">Import MusicXML or note text</label><input type="file" id="is-file" accept=".musicxml,.xml,.txt,.notes" aria-label="Import a MusicXML or note text file"></div><div class="instrudio-suite-field"><label for="is-text">Or paste note text</label><textarea id="is-text" placeholder="Example: E4/1 F#4/0.5 G4/2 R/1" aria-label="Paste note text here"></textarea></div><div class="instrudio-suite-actions"><button class="instrudio-suite-btn secondary" id="is-play-import" aria-label="Play imported score">Play imported score</button></div><div class="instrudio-suite-note">This dock is native to this page. It silently talks to the shared playback engine and routes note glow/playback through the current instrument bridge. Shortcut: Space = play, S = stop.</div><div class="instrudio-suite-msg" id="is-msg" role="status" aria-live="polite"></div>`;
    const msg=host.querySelector('#is-msg'), songSelect=host.querySelector('#is-song'), tempoInput=host.querySelector('#is-tempo'), transposeInput=host.querySelector('#is-transpose'), loopInput=host.querySelector('#is-loop'), fileInput=host.querySelector('#is-file'), textInput=host.querySelector('#is-text'), progressFill=host.querySelector('#is-progress-fill'), timeline=host.querySelector('#is-timeline'), dropzone=host.querySelector('#is-dropzone');
    const setMsg=(t,ok=true)=>{ msg.textContent=t; msg.style.color=ok?'#9effc8':'#ffb8b8'; showRuntimeMessage(t,!ok); };
    const setTimeline=(events,activeIdx=null)=>{ timeline.innerHTML=pillsFromEvents(events||[]); if(activeIdx!=null){ const el=timeline.querySelector(`[data-idx="${activeIdx}"]`); if(el) el.classList.add('active'); } };
    const onProgress=(pct, idx, done)=>{ progressFill.style.width=((pct||0)*100).toFixed(1)+'%'; [...timeline.children].forEach(ch=>ch.classList.remove('active')); if(idx!=null){ const el=timeline.querySelector(`[data-idx="${idx}"]`); if(el) el.classList.add('active'); } if(done && !loopInput.checked) setMsg('Playback complete.'); };
    function playPayload(payload){ setTimeline(payload.events); schedulePlayback(payload, bridge, onProgress); setMsg(`Playing ${payload.source} on ${bridge.instrument}.`); }
    function currentSongPayload(){ const songId=songSelect.value; const parsed=makeSongEvents(songId); parsed.tempo=Math.max(40,Math.min(220,parseInt(tempoInput.value,10)||parsed.tempo)); return buildPayload('song', bridge.instrument, parsed, songId, {transpose:parseInt(transposeInput.value,10)||0, loop:loopInput.checked}); }
    songSelect.onchange=()=>{ const song=SONG_LIBRARY[songSelect.value]; if(song) tempoInput.value=song.tempo; setTimeline(makeSongEvents(songSelect.value).events); };
    songSelect.onchange();
    host.querySelector('#is-play-song').onclick=()=>{ try{ playPayload(currentSongPayload()); } catch(err){ setMsg(err.message,false); } };
    host.querySelector('#is-stop-song').onclick=()=>{ stopPlayback(); progressFill.style.width='0%'; setMsg('Playback stopped.'); };
    host.querySelector('#is-play-import').onclick=async()=>{ try{ let parsed; if(fileInput.files[0]) parsed=parseInput(fileInput.files[0].name, await fileInput.files[0].text()); else if(textInput.value.trim()) parsed=parseInput('pasted.notes', textInput.value.trim()); else throw new Error('Choose a file or paste note text first.'); parsed.tempo=Math.max(40,Math.min(220,parseInt(tempoInput.value,10)||parsed.tempo||96)); const payload=buildPayload('import', bridge.instrument, parsed, null, {transpose:parseInt(transposeInput.value,10)||0, loop:loopInput.checked}); fileInput.classList.add('instrudio-input-ok'); textInput.classList.remove('instrudio-input-bad'); playPayload(payload); } catch(err){ fileInput.classList.add('instrudio-input-bad'); textInput.classList.add('instrudio-input-bad'); setMsg(err.message,false);} };
    ['dragenter','dragover'].forEach(evt=>dropzone.addEventListener(evt,e=>{e.preventDefault(); dropzone.classList.add('is-over');})); ['dragleave','drop'].forEach(evt=>dropzone.addEventListener(evt,e=>{e.preventDefault(); if(evt==='drop') dropzone.classList.remove('is-over'); else if(e.target===dropzone) dropzone.classList.remove('is-over'); })); dropzone.addEventListener('drop', async e=>{ try{ const file=e.dataTransfer.files?.[0]; if(!file) throw new Error('No file dropped.'); const parsed=parseInput(file.name, await file.text()); parsed.tempo=Math.max(40,Math.min(220,parseInt(tempoInput.value,10)||parsed.tempo||96)); const payload=buildPayload('import', bridge.instrument, parsed, null, {transpose:parseInt(transposeInput.value,10)||0, loop:loopInput.checked}); playPayload(payload); } catch(err){ setMsg(err.message,false); } });
    const pending=loadPending(); if(pending && (!pending.instrument || pending.instrument===bridge.instrument)){ clearPending(); if(pending.tempo) tempoInput.value=pending.tempo; if(pending.transpose!=null) transposeInput.value=pending.transpose; if(pending.songId) songSelect.value=pending.songId; setTimeout(()=>{ try{ playPayload({...pending, loop:false}); } catch(err){ setMsg(err.message,false);} }, 250); }
  }

  function init(){ installGlobalErrorHandling(); unlockPageAudio(); wireInfoOverlay(); ensureInfoButton(); addVersionBadge(); installKeyboardShortcuts(); const path=location.pathname.split('/').pop()||'index.html'; if(path==='index.html' || path==='') mountHomeConsole(); if(window.InstrudioBridge && path!=='index.html') mountInstrumentPanel(window.InstrudioBridge); }
  window.InstrudioSuite={version:INSTRUDIO_VERSION, parseNoteText, parseMusicXML, parseInput, makeSongEvents, schedulePlayback, stopPlayback, songs:SONG_LIBRARY, registerAudioContext};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
})();
