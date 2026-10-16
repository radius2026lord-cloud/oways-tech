(()=>{
const menu=document.querySelector('#menu'),navigation=document.querySelector('#navigation');if(!menu||!navigation)return;
function close(focus=false){navigation.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','فتح القائمة');if(focus)menu.focus()}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';navigation.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'إغلاق القائمة':'فتح القائمة')});
navigation.addEventListener('click',event=>{if(event.target.closest('a'))close()});document.addEventListener('click',event=>{if(!navigation.contains(event.target)&&!menu.contains(event.target))close()});document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){event.preventDefault();close(true)}});window.addEventListener('resize',()=>{if(innerWidth>900)close()});
})();
