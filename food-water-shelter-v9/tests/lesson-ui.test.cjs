// Controller integration test with a minimal in-memory DOM; no browser rendering.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function harness({random=()=>.8,lifespanMs=60000}={}) {
 const elements=new Map();let document;
 class Element {
  constructor(){this.hidden=false;this.dataset={};this.children=[];this.handlers={};this.attrs={};this.style={setProperty(){}};this.classes=new Set();
   this.classList={add:(...a)=>a.forEach(x=>this.classes.add(x)),remove:(...a)=>a.forEach(x=>this.classes.delete(x)),toggle:(x,on)=>on?this.classes.add(x):this.classes.delete(x)};}
  setAttribute(k,v){this.attrs[k]=v;} removeAttribute(k){delete this.attrs[k];}
  append(...a){a.forEach(n=>{this.children.push(n);n.parent=this;});}
  replaceChildren(...a){this.children=[];this.append(...a);}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);}
  addEventListener(k,f){this.handlers[k]=f;}
  click(){return this.handlers.click?.({});}
  focus(){document.activeElement=this;}
  scrollIntoView(){}
  querySelectorAll(selector){return this.children.filter(n=>n.className===selector.slice(1));}
 }
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 for(const m of html.matchAll(/id="([^"]+)"/g))elements.set(m[1],new Element());
 document={activeElement:null,hidden:false,handlers:{},getElementById:id=>elements.get(id),
 createElement:()=>new Element(),createDocumentFragment:()=>new Element(),body:new Element(),
 addEventListener(k,f){this.handlers[k]=f;}};
 let now=0,raf=null,model,timerId=0;const timers=new Map();const sounds=[];const downloads=[];let pngFailure=false;
 const context=vm.createContext({document,Blob, FWSExport:{toCSV:require("../src/exports.js").toCSV,toPNG:async s=>{if(pngFailure)throw Error("encoding failed");return new Blob([JSON.stringify(s)]);},download:(blob,name)=>downloads.push({blob,name})},innerWidth:1100,performance:{now:()=>now},
 requestAnimationFrame:f=>{raf=f;return 1;},cancelAnimationFrame:()=>{raf=null;},
 setTimeout:(f,ms)=>{const id=++timerId;timers.set(id,{f,due:now+ms});return id;},clearTimeout:id=>timers.delete(id),addEventListener(){}});
 for(const file of ['engine.js','data-view.js','sound.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),context);
 const create=context.FWS.createSimulation;
 context.FWS.createSimulation=opts=>(model=create({...opts,random,lifespanMs}));
 context.FWSSound={createSound:()=>({play:name=>sounds.push(name),stop(){},setEnabled:async b=>b})};
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/app.js'),'utf8'),context);
 return {sounds,downloads,failPNG:()=>{pngFailure=true;},get:id=>elements.get(id),document,state:()=>model.snapshot(),tick:ms=>{now+=ms;for(const [id,t] of timers){if(t.due<=now){timers.delete(id);t.f();}}const f=raf;raf=null;f?.(now);}};
}
test('intro, Start, wildfire Resume, manual pause, and Reset coordinate with real engine',()=>{
 const h=harness(),get=h.get;
 assert.equal(get('intro-screen').hidden,false);assert.equal(get('fire-screen').hidden,true);
 assert.equal(get('start').hidden,true);assert.equal(get('terrain').inert,true);
 h.tick(90000);assert.equal(h.state().elapsedMs,0);
 get('wildfire').checked=true;get('wildfire').handlers.change();
 get('intro-start').click();
 assert.equal(h.state().status,'running');assert.equal(get('intro-screen').hidden,true);
 assert.equal(get('terrain').inert,false);assert.equal(h.document.activeElement,get('start'));
 h.tick(28000);assert.equal(h.state().elapsedMs,27000);
 assert.equal(get('fire-screen').hidden,true);assert.equal(get('terrain').attrs['aria-hidden'],'false');
 assert.equal(get('terrain').querySelectorAll('.fire-marker').length,15);
 get('fire-resume').click();assert.equal(h.state().status,'paused');
 h.tick(1999);assert.equal(get('fire-screen').hidden,true);
 h.tick(1);assert.equal(get('terrain').querySelectorAll('.fire-marker').length,0);
 assert.equal(get('fire-screen').hidden,false);assert.equal(get('terrain').inert,true);
 assert.equal(h.document.activeElement,get('fire-title'));
 h.tick(90000);assert.equal(h.state().elapsedMs,27000);
 get('fire-resume').click();assert.equal(get('fire-screen').hidden,true);
 h.tick(1000);assert.equal(h.state().elapsedMs,28000);
 get('start').click();assert.equal(h.state().status,'paused');
 assert.equal(get('fire-screen').hidden,true);
 get('start').click();h.tick(26000);h.tick(2000);assert.equal(get('fire-screen').hidden,false);
 get('reset').click();
 assert.equal(get('intro-screen').hidden,false);assert.equal(get('fire-screen').hidden,true);
 assert.equal(h.state().elapsedMs,0);assert.equal(h.state().lastFire,null);
 assert.equal(h.document.activeElement,get('intro-title'));
 get('intro-start').click();h.tick(1000);assert.equal(h.state().elapsedMs,1000);
});


test('export buttons capture history, respect Reset, and recover from PNG errors',async()=>{
 const h=harness();
 await h.get('export-csv').click();
 assert.match(h.downloads[0].name,/\.csv$/);
 assert.ok((await h.downloads[0].blob.text()).includes('0,10,0,0,30'));
 h.get('intro-start').click();h.tick(2000);
 await h.get('export-png').click();
 assert.match(h.downloads[1].name,/\.png$/);
 assert.equal(JSON.parse(await h.downloads[1].blob.text()).elapsedMs,2000);
 assert.equal(h.state().status,'running');
 h.get('reset').click();await h.get('export-csv').click();
 assert.equal((await h.downloads[2].blob.text()).trim().split('\r\n').length,2);
 h.failPNG();await h.get('export-png').click();
 assert.equal(h.downloads.length,3);
 assert.equal(h.get('export-png').disabled,false);
 assert.equal(h.get('export-csv').disabled,false);
 assert.match(h.get('export-status').textContent,/could not/);
});

test('Reset cancels the flame preview and its pending lesson',()=>{
 const h=harness();h.get('wildfire').checked=true;h.get('wildfire').handlers.change();
 h.get('intro-start').click();h.tick(27000);
 assert.equal(h.get('terrain').querySelectorAll('.fire-marker').length,15);
 h.get('reset').click();h.tick(3000);
 assert.equal(h.state().status,'ready');assert.equal(h.get('fire-screen').hidden,true);
 assert.equal(h.get('terrain').querySelectorAll('.fire-marker').length,0);
 assert.equal(h.get('fire-markers').attrs.d,'');
});
test('zero-shelter fire opens accurate lesson immediately and marks graph',()=>{
 const h=harness({random:()=>0});h.get('wildfire').checked=true;h.get('wildfire').handlers.change();
 h.get('intro-start').click();h.tick(15000);
 assert.equal(h.get('fire-screen').hidden,false);
 assert.match(h.get('fire-title').textContent,/No sagebrush/);
 assert.equal(h.get('terrain').querySelectorAll('.fire-marker').length,0);
 assert.equal(h.get('fire-markers').attrs.d,'M640,0V160');
});
test('delayed frame displays deaths and signals them only once',()=>{
 const h=harness({random:()=>0,lifespanMs:10000});h.get('intro-start').click();h.tick(5000);
 const nodes=h.get('terrain').children;
 nodes.find(n=>n.dataset.id===h.state().lizards[0].id).click();
 nodes.find(n=>n.dataset.id===h.state().resources[0].id).click();
 h.tick(7000);
 assert.equal(h.get('terrain').querySelectorAll('.death-marker').length,9);
 assert.equal(h.sounds.filter(s=>s==='death').length,1);
 h.tick(999);assert.equal(h.get('terrain').querySelectorAll('.death-marker').length,9);
 h.tick(1);assert.equal(h.get('terrain').querySelectorAll('.death-marker').length,0);
 assert.equal(h.sounds.filter(s=>s==='death').length,1);
});

test('matched squares stay blank until birth, including through Pause',()=>{
 const h=harness({random:()=>0,lifespanMs:10000});h.get('intro-start').click();
 const entities=()=>h.get('terrain').children.filter(n=>n.dataset.id);
 const parent=entities().find(n=>n.className==='entity lizard');
 const resource=entities().find(n=>n.className==='entity resource food');
 const squares=[parent,resource].map(n=>n.style.gridColumn+','+n.style.gridRow);
 parent.click();resource.click();h.tick(1000);
 assert.equal(h.state().lizards.length,9);
 assert.ok(entities().every(n=>!squares.includes(n.style.gridColumn+','+n.style.gridRow)));
 h.get('start').click();h.tick(5000);assert.equal(h.state().lizards.length,9);
 h.get('start').click();h.tick(1000);assert.equal(h.state().lizards.length,11);
 assert.ok(h.state().lizards.filter(l=>l.bornAt===2000).every(l=>l.expiresAt===12000));
 assert.equal(new Set(entities().map(n=>n.style.gridColumn+','+n.style.gridRow)).size,40);
});
