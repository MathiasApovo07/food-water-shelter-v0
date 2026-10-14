const {test}=require('node:test'),assert=require('node:assert/strict');
const {createSound}=require('../src/sound.js');
function fixture(){
 let created=0,started=0,stopped=0;
 const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 const ctx={state:'running',currentTime:0,destination:{},resume:async()=>{},
 createGain:()=>({gain:param(),connect(){},disconnect(){}}),
 createOscillator:()=>{created++;return {frequency:param(),connect(){},disconnect(){},start(){started++;},stop(){stopped++;}};}};
 return {ctx,sound:createSound(()=>ctx),stats:()=>({created,started,stopped})};
}
test('silent by default, short success effect after user enables, mute stops active effects',async()=>{
 const f=fixture();f.sound.play('match');assert.equal(f.stats().created,0);
 assert.equal(await f.sound.setEnabled(true),true);
 f.sound.play('match');assert.equal(f.stats().created,2);
 f.sound.stop();assert.ok(f.stats().stopped>=2);
 await f.sound.setEnabled(false);const n=f.stats().created;f.sound.play('fire');assert.equal(f.stats().created,n);
});
test('rapid deaths are throttled and fire replaces other sounds',async()=>{
 const f=fixture();await f.sound.setEnabled(true);f.sound.play('death');f.sound.play('death');
 assert.equal(f.stats().created,1);f.ctx.currentTime=1;f.sound.play('death');assert.equal(f.stats().created,2);
 f.sound.play('fire');assert.ok(f.stats().created>2);
});
test('unsupported audio stays silent without affecting the game',async()=>{
 const s=createSound(()=>{throw Error('unsupported');});
 assert.equal(await s.setEnabled(true),false);assert.doesNotThrow(()=>s.play('match'));
});

