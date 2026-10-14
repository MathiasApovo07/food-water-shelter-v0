(function () {
  'use strict';
  const byId = id => document.getElementById(id);
  const terrain = byId('terrain'), startButton = byId('start'), resetButton = byId('reset');
  const introScreen = byId('intro-screen'), fireScreen = byId('fire-screen');
  let lesson = null, firePreview = false, fireTimer = null;
  const flames = [];
  function clearFirePreview() { clearTimeout(fireTimer); fireTimer = null; firePreview = false; flames.splice(0).forEach(n=>n.remove()); }
  const drought = byId('drought'), wildfire = byId('wildfire');
  const labels = {food:'Food',water:'Water',shelter:'Shelter'};
  const icons = {
    lizard: '<svg viewBox="0 0 60 45" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 26C7 28 2 22 5 16M25 17l-8-8-5 2m24 9 6-9 5 1M25 28l-8 8-6-1m24-8 5 10 5-1"/><path d="M20 23c0-7 9-12 17-8l10 2 5 5-6 6-9 2c-8 5-17 0-17-7Z" fill="currentColor"/></g><circle cx="45" cy="21" r="1.6" fill="#f6f8df"/></svg>'
  };
  const sound = FWSSound.createSound();
  let soundEnabled = false;
  const soundButton = byId('sound-toggle');
  soundButton.addEventListener('click',async()=>{
    soundButton.disabled = true;
    soundEnabled = await sound.setEnabled(!soundEnabled);
    soundButton.textContent = soundEnabled ? 'Sound: on' : 'Sound: off';
    soundButton.setAttribute('aria-pressed',String(soundEnabled));
    soundButton.setAttribute('aria-label',soundEnabled ? 'Disable sound effects' : 'Enable sound effects');
    soundButton.disabled = false;
    announce(soundEnabled ? 'Sound effects enabled.' : 'Sound effects off.');
    if(soundEnabled && !document.hidden) sound.play('match');
  });
  let sim = FWS.createSimulation();
  let selectedId = null, frame = null, lastTime = 0, lastPaint = 0, lastDataKey = '';
  let lastDeathTime = -1, lastFireTime = -1;
  let lastStatus = 'ready', pointer = null, ghost = null, suppressClick = false;
  let columns = innerWidth <= 600 ? 5 : 8;
  const nodes = new Map(), slots = new Map(), deathSeen = new Set();
  function announce(text) { byId('announcer').textContent = text; }
  function feedback(text, kind = '') { byId('feedback').textContent = text; byId('field-message').className = 'field-message ' + kind; }
  const formatTime = ms => `${String(Math.floor(ms / 60000)).padStart(2,'0')}:${String(Math.floor(ms / 1000)%60).padStart(2,'0')}`;
  function setSlot(node, slot) { node.style.gridColumn = String(slot % columns + 1); node.style.gridRow = String(Math.floor(slot / columns) + 1); }
  function place(node, entity) {
    const occupied = new Set(slots.values());
    const wanted = Math.min(39, Math.floor(entity.y * 5) * 8 + Math.floor(entity.x * 8));
    let slot = wanted;
    while (occupied.has(slot)) slot = (slot + 1) % 40;
    slots.set(entity.id, slot); setSlot(node, slot);
  }
  function newNode(entity, isLizard) {
    const node = document.createElement('button'); node.type = 'button';
    node.className = `entity ${isLizard ? 'lizard' : 'resource ' + entity.type}`;
    node.dataset.id = entity.id; node.dataset.type = isLizard ? entity.need : entity.type;
    node.setAttribute('aria-label', isLizard ? `Lizard ${entity.id.slice(1)} needs ${labels[entity.need]}` : `${labels[entity.type]} resource ${entity.id.slice(1)}`);
    node.innerHTML = isLizard ? icons.lizard : '<img class="resource-art" src="assets/' + entity.type + '.png" alt="" draggable="false">';
    const kind = document.createElement('span'); kind.className = 'entity-kind'; kind.textContent = isLizard ? 'NEEDS' : 'RESOURCE'; node.append(kind);
    const name = document.createElement('span'); name.className = 'entity-label'; name.textContent = labels[isLizard ? entity.need : entity.type]; node.append(name);
    if (isLizard) {
      node.setAttribute('aria-pressed','false');
      const meter = document.createElement('span'); meter.className = 'life-meter'; meter.setAttribute('aria-hidden','true'); meter.append(document.createElement('i')); node.append(meter);
      if (entity.bornAt > 0) node.classList.add('newborn');
    }
    node.addEventListener('click', () => { if (!suppressClick) activate(entity.id, isLizard); });
    nodes.set(entity.id, node); place(node, entity); terrain.append(node);
    return node;
  }
  function renderData(s) {
    const last = s.history.at(-1);
    const key = JSON.stringify(last) + ':' + s.history.length + ':' + s.fires.length;
    if (key === lastDataKey) return;
    lastDataKey = key;
    const data = FWSData.prepareSeries(s.history, {width:640,height:160,fires:s.fires});
    for (const [name,path] of Object.entries(data.paths)) byId('path-'+name).setAttribute('d',path);
    byId('fire-markers').setAttribute('d',data.fireMarkers.map(f=>'M'+f.x+',0V160').join(' '));
    byId('chart-desc').textContent = 'The same readings are available in the data table below. Wildfires: ' + (s.fires.length ? s.fires.map(f=>(f.timeMs/1000).toFixed(2)+' seconds, '+f.removed+' shelters burned').join('; ') : 'none') + '.';
    byId('axis-top').textContent = data.yMax;
    byId('axis-middle').textContent = data.yMax / 2;
    byId('axis-start').textContent = `${Math.floor(data.xMin/1000)} s`;
    byId('axis-end').textContent = `${Math.floor(data.xMax/1000)} s`;
    byId('sample-label').textContent = s.elapsedMs === 0 ? 'At the starting point' : `Latest reading: ${(last.timeMs/1000).toFixed(2)} s · full session`;
    const fragment = document.createDocumentFragment();
    for (const row of data.latestRows) {
      const tr = document.createElement('tr');
      for (const v of [(row.timeMs/1000).toFixed(2),row.lizards,row.food,row.water,row.shelter]) {
        const td = document.createElement('td'); td.textContent = v; tr.append(td);
      }
      fragment.append(tr);
    }
    byId('history-body').replaceChildren(fragment);
  }
  function render() {
    const s = sim.snapshot();
    if (s.lastFire && s.lastFire.timeMs > lastFireTime) {
      lastFireTime = s.lastFire.timeMs;
      byId('fire-title').textContent = FWSData.fireMessage(s.lastFire);
      clearFirePreview();
      for (const burned of s.lastFire.burned) {
        const marker = document.createElement('span');
        marker.className = 'fire-marker'; marker.textContent = '🔥'; marker.setAttribute('aria-hidden','true');
        const slot = slots.get(burned.id) ?? Math.min(39,Math.floor(burned.y*5)*8+Math.floor(burned.x*8));
        marker.dataset.slot = slot; setSlot(marker,slot); terrain.append(marker); flames.push(marker);
      }
      firePreview = flames.length > 0;
      if (firePreview) {
        cancelDrag(); selectedId = null; resetButton.focus({preventScroll:true});
        fireTimer = setTimeout(()=>{clearFirePreview();render();},2000);
      }
      if (!document.hidden) sound.play('fire');
      const text = s.lastFire.removed === 0 ? FWSData.fireMessage(s.lastFire) :
        'Wildfire at '+(lastFireTime/1000).toFixed(1)+' s: '+s.lastFire.removed+' shelter resources disappeared. Shelter can return after lizards die.';
      byId('event-feedback').textContent = text; announce(text);
    }
    const nextLesson = s.status === 'ready' ? 'intro' : s.pauseReason === 'wildfire' && !firePreview ? 'fire' : null;
    introScreen.hidden = nextLesson !== 'intro';
    fireScreen.hidden = nextLesson !== 'fire';
    terrain.inert = Boolean(nextLesson) || firePreview;
    terrain.setAttribute('aria-hidden', String(Boolean(nextLesson)));
    startButton.hidden = Boolean(nextLesson) || firePreview;
    if (nextLesson !== lesson) {
      lesson = nextLesson;
      if (lesson) {
        cancelDrag(); selectedId = null;
        byId(lesson === 'intro' ? 'intro-title' : 'fire-title').focus({preventScroll: true});
        if (lesson === 'fire') fireScreen.scrollIntoView({block:'nearest'});
      }
    }
    const states = {ready:'Ready',running:'Running',paused:'Paused',ended:'Session ended'};
    byId('state-label').textContent = states[s.status]; byId('state-label').dataset.state = s.status; terrain.dataset.state = s.status;
    byId('elapsed').textContent = formatTime(s.elapsedMs);
    byId('count-lizards').textContent = s.lizards.length;
    for (const kind of FWS.TYPES) byId('count-'+kind).textContent = s.resources.filter(r => r.type === kind).length;
    drought.disabled = wildfire.disabled = s.status !== 'ready';
    startButton.disabled = s.status === 'ended';
    const running = s.status === 'running';
    startButton.setAttribute('aria-label', running ? 'Pause simulation' : s.status === 'paused' ? 'Resume simulation' : 'Start simulation');
    byId('start-text').textContent = running ? 'Pause' : s.status === 'paused' ? 'Resume' : 'Start';
    byId('start-icon').textContent = running ? 'Ⅱ' : '▶';
    const entities = [...s.lizards,...s.resources], ids = new Set(entities.map(e => e.id));
    const activeId = document.activeElement?.dataset?.id;
    let lostFocus = false;
    for (const d of s.deaths) {
      if (!deathSeen.has(d.id)) {
        deathSeen.add(d.id);
        const marker = document.createElement('span'); marker.className = 'death-marker'; marker.textContent = '☠'; marker.setAttribute('aria-hidden','true'); setSlot(marker, slots.get(d.id) ?? Math.min(39,Math.floor(d.y*5)*8+Math.floor(d.x*8))); terrain.append(marker);
        setTimeout(() => marker.remove(),1000);
      }
    }
    for (const [id,node] of nodes) {
      if (!ids.has(id)) { if (activeId === id) lostFocus = true; node.remove(); nodes.delete(id); slots.delete(id); }
    }
    if (selectedId && !s.lizards.some(l => l.id === selectedId)) {
      selectedId = null;
      if (s.status === 'running') feedback('That lizard is no longer here. Select another lizard to continue.');
    }
    const recentDeath = s.deaths.at(-1);
    if (recentDeath && recentDeath.timeMs > lastDeathTime) {
      lastDeathTime = recentDeath.timeMs;
      if(!document.hidden) sound.play('death');
      const number = s.deaths.filter(d => d.timeMs === lastDeathTime).length;
      byId('event-feedback').textContent = `${number} lizard${number === 1 ? '' : 's'} died after ten seconds without a match. Each death returned one resource.`;
    }
    const chosen = s.lizards.find(l => l.id === selectedId);
    for (const e of entities) {
      const isLizard = e.need !== undefined;
      const node = nodes.get(e.id) || newNode(e,isLizard);
      // Keep entities focusable while paused so keyboard users retain their place.
      node.setAttribute('aria-disabled', String(!running));
      node.classList.toggle('selected',e.id === selectedId);
      node.classList.toggle('match-hint',Boolean(chosen && !isLizard && chosen.need === e.type && running));
      if (isLizard) {
        node.setAttribute('aria-pressed',String(e.id === selectedId));
        const ratio = Math.max(0,(e.expiresAt-s.elapsedMs)/s.lifespanMs);
        node.style.setProperty('--life',String(ratio)); node.classList.toggle('urgent', ratio < .25);
      }
    }
    if (lostFocus && !lesson && !firePreview) (s.lizards.length ? nodes.get(s.lizards[0].id) : resetButton).focus({preventScroll:true});
    if (s.status === 'ended' && lastStatus !== 'ended') {
      cancelDrag(); feedback('No lizards remain. Look at the graph, then Reset to try a different strategy.'); announce('Session ended. No lizards remain. Reset to try again.');
      if (document.activeElement === startButton) resetButton.focus({preventScroll:true});
    }
    lastStatus = s.status;
    renderData(s);
  }
  function syncTime() {
    if (sim.snapshot().status === 'running') {
      const now = performance.now(); sim.advance(Math.max(0,now-lastTime)); lastTime = now;
    }
  }
  function loop(now) {
    frame = null; syncTime();
    if (now-lastPaint >= 80 || sim.snapshot().status !== 'running') { render(); lastPaint=now; }
    if (sim.snapshot().status === 'running') frame=requestAnimationFrame(loop);
  }
  function beginLoop() { lastTime=performance.now(); lastPaint=0; if (frame!==null) cancelAnimationFrame(frame); frame=requestAnimationFrame(loop); }
  function stopLoop() { sound.stop(); if (frame!==null) cancelAnimationFrame(frame); frame=null; }
  function activate(id, isLizard) {
    syncTime(); const s=sim.snapshot();
    if (s.status!=='running') { render(); return; }
    if (isLizard) {
      const l=s.lizards.find(l=>l.id===id); if(!l) return;
      selectedId=selectedId===id?null:id;
      const text=selectedId?`This lizard needs ${labels[l.need].toLowerCase()}. Select a matching resource.`:'Selection cleared. Choose a lizard.';
      feedback(text); announce(text); render(); return;
    }
    if (!selectedId) { feedback('First select a lizard, then select the resource it needs.'); announce('Select a lizard first.'); return; }
    const result=sim.match(selectedId,id);
    if(result.ok) { if(!document.hidden) sound.play('match'); selectedId=null; render(); feedback('A successful match! One resource used, two new lizards born.','success'); announce('Successful match. Two new lizards born.'); }
    else if(result.reason==='wrong-resource') { feedback('Not this resource. Match the word on the lizard to the resource.','warning'); announce('That resource does not match this lizard’s need.'); render(); }
    else { selectedId=null; render(); feedback('That lizard or resource is no longer available. Choose another lizard.'); }
  }
  function dismissLesson(expected) {
    const s = sim.snapshot();
    if (firePreview) return;
    if (expected === 'intro' ? s.status !== 'ready' : s.pauseReason !== 'wildfire') return;
    sim.start(); beginLoop(); render();
    feedback('Select a lizard, then a resource that matches its need.');
    announce(expected === 'intro' ? 'Simulation running.' : 'Simulation resumed.');
    startButton.focus({preventScroll:true});
  }
  byId('intro-start').addEventListener('click',()=>dismissLesson('intro'));
  byId('fire-resume').addEventListener('click',()=>dismissLesson('fire'));
  let exporting = false;
  async function exportResults(format) {
    if (exporting) return;
    syncTime(); render();
    const snapshot = sim.snapshot();
    exporting = true;
    byId('export-csv').disabled = byId('export-png').disabled = true;
    byId('export-status').textContent = 'Preparing ' + format.toUpperCase() + '…';
    try {
      const blob = format === 'csv' ? new Blob([FWSExport.toCSV(snapshot.history)], {type:'text/csv;charset=utf-8'}) : await FWSExport.toPNG(snapshot);
      const stamp = new Date().toISOString().replace(/[:.]/g,'-');
      FWSExport.download(blob, 'food-water-shelter-' + stamp + '.' + format);
      byId('export-status').textContent = format.toUpperCase() + ' download requested. Snapshot at ' + (snapshot.elapsedMs/1000).toFixed(2) + ' s.';
    } catch (error) {
      byId('export-status').textContent = 'Download could not be prepared. Please try again in a browser that supports file downloads.';
    } finally {
      exporting = false; byId('export-csv').disabled = byId('export-png').disabled = false;
    }
  }
  byId('export-csv').addEventListener('click',()=>exportResults('csv'));
  byId('export-png').addEventListener('click',()=>exportResults('png'));
  startButton.addEventListener('click',()=>{
    if (sim.snapshot().status === 'ready' || sim.snapshot().pauseReason === 'wildfire') return;
    if(sim.snapshot().status==='running') { syncTime(); sim.pause(); stopLoop(); cancelDrag(); render(); if(sim.snapshot().status==='paused' && sim.snapshot().pauseReason !== 'wildfire'){ feedback('Paused. Take a moment to look at the habitat and the graph.'); announce('Simulation paused.'); } }
    else { sim.start(); if(sim.snapshot().status==='running'){ beginLoop(); render(); feedback('Select a lizard, then a resource that matches its need.'); announce('Simulation running.'); } }
  });
  resetButton.addEventListener('click',()=>{
    clearFirePreview(); stopLoop(); cancelDrag(); selectedId=null; deathSeen.clear(); lastDeathTime=lastFireTime=-1; terrain.querySelectorAll('.death-marker').forEach(n=>n.remove()); sim.reset(); lastDataKey=''; render();
    byId('event-feedback').textContent='A successful match replaces one lizard with two. An unmet need causes death and returns one resource.';
    terrain.classList.remove('wildfire-flash');
    feedback('A fresh habitat. Press Start when you are ready.'); announce('Simulation reset. 10 lizards and 30 resources.');
  });
  function updateOptions() {
    if(sim.snapshot().status!=='ready') return;
    clearFirePreview(); stopLoop(); cancelDrag(); selectedId=null; nodes.forEach(n=>n.remove()); nodes.clear(); slots.clear();
    deathSeen.clear(); lastDeathTime=lastFireTime=-1;
    sim=FWS.createSimulation({drought:drought.checked,wildfire:wildfire.checked});
    lastDataKey=''; render();
    feedback('Options updated. Press Start; each lizard has ten seconds.');
  }
  drought.addEventListener('change',updateOptions);
  wildfire.addEventListener('change',updateOptions);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden) sound.stop();
    if(document.hidden && sim.snapshot().status==='running') { syncTime(); sim.pause(); stopLoop(); cancelDrag(); render(); if(sim.snapshot().status==='paused' && sim.snapshot().pauseReason !== 'wildfire'){feedback('Paused while you were away. Press Resume to continue.'); announce('Simulation paused because the page was hidden.');} }
  });
  function cancelDrag() {
    if(pointer) nodes.get(pointer.id)?.classList.remove('drag-source');
    ghost?.remove(); ghost=null; pointer=null;
    terrain.querySelectorAll('.drop-target').forEach(n=>n.classList.remove('drop-target'));
  }
  terrain.addEventListener('pointerdown',event=>{
    const target=event.target.closest('.entity.lizard');
    if(!target || event.button!==0 || sim.snapshot().status!=='running') return;
    pointer={id:target.dataset.id,pointerId:event.pointerId,x:event.clientX,y:event.clientY,moved:false};
    // CSS reserves drags starting on a lizard; other areas still scroll.
    // Touch pointers receive implicit browser capture; moves are handled on document.
  });
  document.addEventListener('pointermove',event=>{
    if(!pointer || event.pointerId!==pointer.pointerId) return;
    if(!nodes.has(pointer.id)){cancelDrag();return;}
    if(!pointer.moved && Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)>7) {
      const source=nodes.get(pointer.id); if(!source){cancelDrag();return;}
      pointer.moved=true; selectedId=pointer.id; source.classList.add('drag-source');
      ghost=source.cloneNode(true); ghost.classList.add('drag-ghost'); ghost.classList.remove('drag-source'); ghost.removeAttribute('data-id'); ghost.tabIndex=-1; ghost.setAttribute('aria-hidden','true'); document.body.append(ghost);
    }
    if(!ghost) return;
    event.preventDefault(); ghost.style.left=event.clientX+'px'; ghost.style.top=event.clientY+'px';
    terrain.querySelectorAll('.drop-target').forEach(n=>n.classList.remove('drop-target'));
    document.elementFromPoint(event.clientX,event.clientY)?.closest('.entity.resource')?.classList.add('drop-target');
  });
  document.addEventListener('pointerup',event=>{
    if(!pointer || event.pointerId!==pointer.pointerId) return;
    const moved=pointer.moved;
    const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('.entity.resource');
    cancelDrag();
    if(moved){suppressClick=true;setTimeout(()=>{suppressClick=false;},0);if(target)activate(target.dataset.id,false);else render();}
  });
  document.addEventListener('pointercancel',cancelDrag);
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && !lesson){cancelDrag();selectedId=null;render();feedback('Selection cleared. Choose a lizard.');}});
  addEventListener('resize',()=>{const next=innerWidth<=600?5:8;if(next!==columns){columns=next;for(const marker of flames)setSlot(marker,Number(marker.dataset.slot));for(const[id,node]of nodes)setSlot(node,slots.get(id));}});
  render();
})();
