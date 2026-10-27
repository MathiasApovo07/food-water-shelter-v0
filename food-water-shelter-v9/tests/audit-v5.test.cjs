
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createSimulation}=require('../src/engine.js');
const data=require('../src/data-view.js');
test('delayed frames retain deaths until Reset',()=>{
 const s=createSimulation({random:()=>0});s.start();s.advance(5000);
 let snap=s.snapshot();s.match(snap.lizards[0].id,snap.resources[0].id);s.advance(7000);
 assert.equal(s.snapshot().elapsedMs,12000);assert.equal(s.snapshot().deaths.length,9);
 s.reset();assert.equal(s.snapshot().deaths.length,0);
});
test('fire history retains exact burned targets and independent snapshots',()=>{
 const s=createSimulation({random:()=>.8,lifespanMs:120000,wildfire:true});
 s.start();s.advance(27000);let a=s.snapshot();
 assert.equal(a.fires.length,1);assert.equal(a.lastFire.burned.length,15);
 assert.ok(a.lastFire.burned.every(b=>!a.resources.some(r=>r.id===b.id)));
 a.fires[0].burned[0].x=-1;assert.notEqual(s.snapshot().fires[0].burned[0].x,-1);
 s.start();s.advance(27000);assert.equal(s.snapshot().fires.length,2);
 s.reset();assert.deepEqual(s.snapshot().fires,[]);
});
test('graph markers preserve fire times including zero losses',()=>{
 const history=[{timeMs:0,lizards:10,food:10,water:10,shelter:10},{timeMs:30000,lizards:10,food:10,water:10,shelter:0}];
 const p=data.prepareSeries(history,{width:600,height:160,fires:[{timeMs:15000,removed:0},{timeMs:30000,removed:5}]});
 assert.deepEqual(p.fireMarkers.map(f=>f.x),[300,600]);
 assert.match(data.fireMessage({removed:0}),/No sagebrush/);
 assert.match(data.fireMessage({removed:5}),/burning some/);
});
