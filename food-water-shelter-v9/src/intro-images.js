
(function(){
'use strict';
const dialog=document.getElementById('intro-image-dialog');
const picture=document.getElementById('image-dialog-content');
const title=document.getElementById('image-dialog-title');
let trigger=null;
document.querySelectorAll('.intro-image').forEach(button=>{
button.addEventListener('click',()=>{
trigger=button;picture.src=button.dataset.image;picture.alt=button.querySelector('img').alt;
title.textContent=button.dataset.title;dialog.showModal();
});
});
dialog.querySelector('.image-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{if(trigger)trigger.focus({preventScroll:true});});
})();