const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createSimulation}=require('../src/engine.js');
test('wildfire stops at exact event time, rejects matches, freezes every deadline until Resume',()=>{
 const sim=createSimulation({wildfire:true,random:()=>.8,lifespanMs:60000});
 sim.start();sim.advance(55000);const frozen=sim.snapshot();
 assert.equal(frozen.status,'paused');assert.equal(frozen.pauseReason,'wildfire');
 assert.equal(frozen.elapsedMs,27000);assert.equal(frozen.lastFire.timeMs,27000);
 sim.advance(999999);assert.deepEqual(sim.snapshot(),frozen);
 assert.equal(sim.match(frozen.lizards[0].id,frozen.resources[0].id).reason,'not-running');
 sim.pause();assert.equal(sim.snapshot().pauseReason,'wildfire');
 sim.start();assert.equal(sim.snapshot().pauseReason,null);
 sim.advance(1000);assert.equal(sim.snapshot().elapsedMs,28000);
 assert.deepEqual(sim.snapshot().lizards,frozen.lizards);
 sim.advance(26000);assert.equal(sim.snapshot().elapsedMs,54000);
 assert.equal(sim.snapshot().pauseReason,'wildfire');
});
test('Reset from wildfire returns ready at zero and removes pending lesson',()=>{
 const sim=createSimulation({wildfire:true,random:()=>.8,lifespanMs:60000});
 sim.start();sim.advance(27000);sim.reset();
 const s=sim.snapshot();assert.equal(s.status,'ready');assert.equal(s.pauseReason,null);
 assert.equal(s.elapsedMs,0);assert.equal(s.lastFire,null);assert.equal(s.resources.length,30);
 sim.advance(50000);assert.equal(sim.snapshot().elapsedMs,0);
});
test('ordinary pause does not open wildfire lesson and extinction stays ended',()=>{
 const sim=createSimulation({wildfire:true,random:()=>.8});
 sim.start();sim.advance(2000);sim.pause();assert.equal(sim.snapshot().pauseReason,'manual');
 sim.start();sim.advance(50000);assert.equal(sim.snapshot().status,'ended');
 assert.equal(sim.snapshot().lastFire,null);
});
