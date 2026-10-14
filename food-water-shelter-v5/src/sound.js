(function(root){
'use strict';
function createSound(makeContext=()=>new (root.AudioContext||root.webkitAudioContext)()){
 let context=null,enabled=false,master=null;
 const active=new Set(),last={};
 function stop(){
  for(const node of active){try{node.stop();node.disconnect();}catch{}}
  active.clear();
  for(const key of Object.keys(last))delete last[key];
 }
 async function setEnabled(value){
  enabled=false;stop();
  if(!value)return false;
  try{
   if(!context){context=makeContext();master=context.createGain();master.gain.value=.18;master.connect(context.destination);}
   if(context.state!=='running')await context.resume();
   enabled=context.state==='running';return enabled;
  }catch{return false;}
 }
 function tone(frequency,offset,duration,volume,type='sine',end=frequency){
  const start=context.currentTime+offset,osc=context.createOscillator(),gain=context.createGain();
  osc.type=type;osc.frequency.setValueAtTime(frequency,start);osc.frequency.exponentialRampToValueAtTime(end,start+duration);
  gain.gain.setValueAtTime(.0001,start);gain.gain.linearRampToValueAtTime(volume,start+.008);
  gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  osc.connect(gain);gain.connect(master);active.add(osc);
  osc.onended=()=>{active.delete(osc);osc.disconnect();gain.disconnect();};
  osc.start(start);osc.stop(start+duration+.02);
 }
 function play(kind){
  if(!enabled||!context||context.state!=='running')return;
  try{
   const now=context.currentTime,interval={match:.15,death:.7,fire:1}[kind];
   if(interval===undefined||now-(last[kind]??-Infinity)<interval)return;
   if(kind==='fire')stop();
   last[kind]=now;
   if(active.size>12)return;
   if(kind==='match'){tone(660,0,.12,.25);tone(880,.09,.16,.2);}
   if(kind==='death')tone(220,0,.19,.18,'sine',150);
   if(kind==='fire')for(let i=0;i<7;i++)tone(150+i*37,i*.055,.045,.1,'triangle',65+i*13);
  }catch{stop();enabled=false;}
 }
 return {setEnabled,play,stop};
}
if(typeof module!=='undefined'&&module.exports)module.exports={createSound};else root.FWSSound={createSound};
})(typeof globalThis!=='undefined'?globalThis:this);

