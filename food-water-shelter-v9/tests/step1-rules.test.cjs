'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createSimulation}=require('../src/engine.js');
const count=(s,t)=>s.resources.filter(r=>r.type===t).length;
test('normal initial resource types use equal thirds, also after reset',()=>{
 for(const [draw,type] of [[0,'food'],[1/3,'water'],[2/3,'shelter']]){
  const sim=createSimulation({random:()=>draw});
  assert.equal(count(sim.snapshot(),type),30);
  sim.reset();assert.equal(count(sim.snapshot(),type),30);
 }
});
test('drought weights apply at start and death without changing lizard needs',()=>{
 for(const [draw,type] of [[.39,'food'],[.4,'water'],[.59,'water'],[.6,'shelter']]){
  const sim=createSimulation({drought:true,random:()=>draw});
  const normal=createSimulation({random:()=>draw});
  assert.equal(count(sim.snapshot(),type),30);
  assert.deepEqual(sim.snapshot().lizards,normal.snapshot().lizards);
  sim.start();sim.advance(10000);assert.equal(count(sim.snapshot(),type),40);
 }
});
test('wildfire interval is 15 to 30 seconds; paused time and reset are respected',()=>{
 for(const n of [0,.5,.999999]){
  const sim=createSimulation({wildfire:true,random:()=>n,lifespanMs:100000});
  assert.equal(sim.snapshot().nextFireMs,15000+n*15000);
  sim.start();sim.advance(500);sim.pause();sim.advance(999999);
  assert.equal(sim.snapshot().elapsedMs,500);
  sim.reset();assert.equal(sim.snapshot().lastFire,null);
  assert.equal(sim.snapshot().nextFireMs,15000+n*15000);
 }
 assert.equal(createSimulation().snapshot().nextFireMs,null);
});
test('repeated fires remove half, round odd counts up, and handle zero shelter',()=>{
 const sim=createSimulation({wildfire:true,random:()=>.8,lifespanMs:1000000});sim.start();
 for(const expected of [15,8,4,2,1,0]){
  const before=sim.snapshot();sim.start();sim.advance(before.nextFireMs-before.elapsedMs);
  const after=sim.snapshot();assert.equal(after.lastFire.removed,expected);
  assert.equal(after.resources.length,before.resources.length-expected);
  assert.deepEqual(after.lizards,before.lizards);
  assert.ok(after.resources.every(r=>before.resources.some(old=>old.id===r.id)));
  assert.equal(after.history.at(-1).shelter,after.resources.length);
 }
});
test('fire keeps food and water, selects shelters randomly, fires at exact boundary',()=>{
 let calls=0;
 const random=()=>{const n=calls++;if(n<30)return .5;if(n<120)return [.1,.5,.9][Math.floor((n-30)/3)%3];if(n===120)return 0;return .999;};
 const sim=createSimulation({wildfire:true,random,lifespanMs:100000});
 const before=sim.snapshot();sim.start();sim.advance(14999);
 assert.equal(sim.snapshot().lastFire,null);
 sim.advance(1);const after=sim.snapshot();assert.equal(after.lastFire.removed,5);
 assert.deepEqual(after.resources.filter(r=>r.type!=='shelter'),before.resources.filter(r=>r.type!=='shelter'));
 assert.ok(!after.resources.some(r=>r.id===before.resources.filter(r=>r.type==='shelter').at(-1).id));
 assert.equal(after.nextFireMs,15000+15000+.999*15000);
});
test('deaths restore shelter naturally after partial fire',()=>{
 const sim=createSimulation({wildfire:true,random:()=>.8,lifespanMs:28000});
 sim.start();sim.advance(27000);assert.equal(count(sim.snapshot(),'shelter'),15);
 sim.start();sim.advance(1000);assert.equal(count(sim.snapshot(),'shelter'),25);
});
