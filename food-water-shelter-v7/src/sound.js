(function(root){
'use strict';
function createSound(makeAudio=src=>new root.Audio(src),clock=()=>root.performance.now()){
 let enabled=false; const clips={},last={},timers={};
 const files={match:'munch.mp3',death:'grunt.mp3',fire:'fire.mp3'};
 function stop(){for(const kind of Object.keys(clips)){clearTimeout(timers[kind]);try{clips[kind].pause();clips[kind].currentTime=0;}catch{}delete last[kind];}}
 async function setEnabled(value){enabled=false;stop();if(!value)return false;try{for(const [kind,file] of Object.entries(files)){if(!clips[kind]){const clip=makeAudio('assets/audio/'+file);clip.preload='auto';clip.volume=kind==='fire'?.75:.45;clip.load();clips[kind]=clip;}}enabled=true;return true;}catch{stop();return false;}}
 function play(kind){if(!enabled||!clips[kind])return;const now=clock(),gap={match:150,death:700,fire:1000}[kind];if(now-(last[kind]??-Infinity)<gap)return;if(kind==='fire')stop();last[kind]=now;const clip=clips[kind];try{clearTimeout(timers[kind]);clip.pause();clip.currentTime=0;const result=clip.play();if(result?.catch)result.catch(()=>{});timers[kind]=setTimeout(()=>{clip.pause();clip.currentTime=0;},kind==='fire'?2000:1800);}catch{}}
 return {setEnabled,play,stop};
}
if(typeof module!=='undefined'&&module.exports)module.exports={createSound};else root.FWSSound={createSound};
})(typeof globalThis!=='undefined'?globalThis:this);
