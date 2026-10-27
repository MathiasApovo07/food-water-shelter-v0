(function(root){
'use strict';
const WIDTH=1400,HEIGHT=850;
const series=[['lizards','Lizards','#45556d',[]],['food','Food','#b47916',[12,7]],['water','Water','#45556d',[3,7]],['shelter','Shelter','#685a1d',[16,6,3,6]]];
function toCSV(history){
 return '\uFEFF'+['Time (s),Lizards,Food,Water,Shelter',...history.map(r=>[r.timeMs/1000,r.lizards,r.food,r.water,r.shelter].join(','))].join('\r\n')+'\r\n';
}
function drawGraph(ctx,s){
 const rows=s.history,left=110,top=200,w=1220,h=500;
 const xMin=rows[0]?.timeMs??0,xMax=Math.max(xMin+1000,rows.at(-1)?.timeMs??1000);
 const yMax=rows.reduce((max,r)=>Math.max(max,r.lizards,r.food,r.water,r.shelter),10);
 ctx.fillStyle='#ffffff';ctx.fillRect(0,0,WIDTH,HEIGHT);
 ctx.fillStyle='#630030';ctx.font='bold 34px Arial';ctx.textAlign='left';
 ctx.fillText('Food, Water, Shelter',left,55);
 ctx.fillStyle='#45556d';ctx.font='22px Arial';ctx.fillText('Population / resource graph',left,92);
 ctx.font='18px Arial';
 ctx.fillText('Drought: '+(s.drought?'on':'off')+'  |  Wildfire: '+(s.wildfire?'on':'off')+'  |  '+s.lifespanMs/1000+' seconds per lizard',left,126);
 series.forEach(([key,label,color,dash],i)=>{
  const x=left+i*275;ctx.strokeStyle=color;ctx.lineWidth=4;ctx.setLineDash(dash);
  ctx.beginPath();ctx.moveTo(x,161);ctx.lineTo(x+46,161);ctx.stroke();
  ctx.fillStyle='#45556d';ctx.fillText(label,x+57,168);
 });
 ctx.setLineDash([]);ctx.lineWidth=1;ctx.font='18px Arial';
 for(let i=0;i<=5;i++){
  const y=top+h-i*h/5;ctx.strokeStyle='#ccd8e0';ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(left+w,y);ctx.stroke();
  ctx.fillStyle='#45556d';ctx.textAlign='right';ctx.fillText(String(Number((yMax*i/5).toFixed(2))),left-15,y+6);
  ctx.textAlign='center';ctx.fillText(String(Number(((xMin+(xMax-xMin)*i/5)/1000).toFixed(2))),left+w*i/5,top+h+30);
 }
 ctx.textAlign='left';ctx.fillText('Count',left,top-18);
 ctx.textAlign='center';ctx.fillText('Time (seconds)',left+w/2,top+h+65);
 for(const [key,,color,dash] of series){
  ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=3;ctx.setLineDash(dash);ctx.beginPath();
  rows.forEach((r,i)=>{const x=left+(r.timeMs-xMin)/(xMax-xMin)*w,y=top+h-r[key]/yMax*h;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});
  ctx.stroke();
  if(rows.length===1){ctx.beginPath();ctx.arc(left,top+h-rows[0][key]/yMax*h,4,0,Math.PI*2);ctx.fill();}
 }
 ctx.strokeStyle='#a32922';ctx.lineWidth=2;ctx.setLineDash([5,4]);
 for(const fire of s.fires??[]){const x=left+(fire.timeMs-xMin)/(xMax-xMin)*w;ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,top+h);ctx.stroke();}
 ctx.fillStyle='#a32922';ctx.textAlign='left';ctx.font='16px Arial';ctx.fillText('Dashed red vertical lines: wildfires',left,790);
 ctx.setLineDash([]);ctx.fillStyle='#45556d';ctx.textAlign='left';ctx.font='16px Arial';
 ctx.fillText('DRI STEM Education | Full recorded session | Snapshot at '+(s.elapsedMs/1000).toFixed(2)+' s',left,815);
}
function toPNG(snapshot){
 return new Promise((resolve,reject)=>{
  try{
   const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=HEIGHT;
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
   drawGraph(ctx,snapshot);
   canvas.toBlob(blob=>blob?resolve(blob):reject(Error('PNG encoding failed')),'image/png');
  }catch(error){reject(error);}
 });
}
function download(blob,filename){
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 try{link.href=url;link.download=filename;document.body.append(link);link.click();}
 finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
}
const api={toCSV,drawGraph,toPNG,download};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FWSExport=api;
})(typeof globalThis!=='undefined'?globalThis:this);

