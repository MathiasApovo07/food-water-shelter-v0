const {test}=require('node:test');
const assert=require('node:assert/strict');
const {toCSV,drawGraph}=require('../src/exports.js');
test('CSV preserves every row, fractional seconds, zero values and Excel UTF-8 marker',()=>{
 const rows=[{timeMs:0,lizards:10,food:8,water:12,shelter:10},{timeMs:10250,lizards:0,food:20,water:10,shelter:10}];
 const copy=JSON.stringify(rows);
 assert.equal(toCSV(rows),'\uFEFFTime (s),Lizards,Food,Water,Shelter\r\n0,10,8,12,10\r\n10.25,0,20,10,10\r\n');
 assert.equal(JSON.stringify(rows),copy);
 assert.equal(toCSV(Array.from({length:1001},(_,i)=>({...rows[0],timeMs:i*1000}))).split('\r\n').length,1003);
});
test('PNG graph draws numeric coordinates, all series, labels and scenario on a white background',()=>{
 const calls=[]; const ctx=new Proxy({}, {get:(o,k)=>o[k]??((...a)=>calls.push([k,...a])),set:(o,k,v)=>(o[k]=v,true)});
 drawGraph(ctx,{history:[{timeMs:0,lizards:0,food:40,water:0,shelter:0}],elapsedMs:0,drought:true,wildfire:false,lifespanMs:10000});
 const texts=calls.filter(c=>c[0]==='fillText').map(c=>c[1]).join(' ');
 for(const word of ['Lizards','Food','Water','Shelter','Time (seconds)','Drought: on','Wildfire: off'])assert.ok(texts.includes(word),word);
 assert.ok(calls.some(c=>c[0]==='fillRect'));
 assert.ok(calls.some(c=>c[0]==='arc'),'Single-point series must be visible');
 for(const c of calls)for(const v of c.slice(1))if(typeof v==='number')assert.ok(Number.isFinite(v));
});


test('PNG marks every wildfire at its time including a zero-loss fire',()=>{
 const calls=[];const ctx=new Proxy({}, {get:(o,k)=>o[k]??((...a)=>calls.push([k,...a])),set:(o,k,v)=>(o[k]=v,true)});
 drawGraph(ctx,{history:[{timeMs:0,lizards:10,food:10,water:10,shelter:10},{timeMs:30000,lizards:10,food:10,water:10,shelter:0}],fires:[{timeMs:15000,removed:0},{timeMs:30000,removed:5}],elapsedMs:30000,lifespanMs:10000,wildfire:true});
 for(const x of [720,1330]){
  assert.ok(calls.some((c,i)=>c[0]==='moveTo'&&c[1]===x&&c[2]===200&&calls[i+1]?.[0]==='lineTo'&&calls[i+1][1]===x&&calls[i+1][2]===700));
 }
 assert.ok(calls.some(c=>c[0]==='fillText'&&c[1]==='Count'));
 assert.ok(calls.some(c=>c[0]==='fillText'&&String(c[1]).includes('vertical lines: wildfires')));
});

