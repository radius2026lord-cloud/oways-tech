// Use capture to gate every existing request/support action before any old local handler.
document.addEventListener('click',e=>{const service=e.target.closest('[data-add]'),support=e.target.closest('[data-contact]');if(service||support){e.preventDefault();e.stopImmediatePropagation();location.href=service?'/account?service='+encodeURIComponent(service.dataset.add):'/account?intent=support&reason='+encodeURIComponent(support.dataset.contact)}},true);
const checkout=document.querySelector('#checkout');checkout.onclick=()=>{location.href='/account'};
document.querySelector('#renew-form').onsubmit=e=>{e.preventDefault();location.href='/account?intent=support&reason='+encodeURIComponent('طلب تجديد '+document.querySelector('#service').value+' — '+document.querySelector('#reference').value)};
(async()=>{try{const response=await fetch('/api/catalog');if(!response.ok)return;const data=await response.json();if(!data.services.length)return;const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const section=document.createElement('section');section.className='section wrap';section.id='managed-services';section.innerHTML='<div class="section-head"><div><div class="eyebrow">خدمات المنصة</div><h2>اختر الخدمة التي <span>تناسبك.</span></h2></div></div>'+data.categories.map(c=>{const services=data.services.filter(s=>String(s.category_id)===String(c.id));if(!services.length)return '';return `<h3>${e(c.name)}</h3><div class="grid three">${services.map(s=>`<article class="web-card">${s.images?.[0]?.src?`<img src="${e(s.images[0].src)}" alt="${e(s.images[0].alt||s.name)}" class="catalog-image" loading="lazy">`:'' }<h3>${e(s.name)}</h3><p>${e(s.description)}</p><ul>${(Array.isArray(s.features)?s.features:[]).map(f=>`<li>${e(f)}</li>`).join('')}</ul><a class="button" href="/account?service=${encodeURIComponent(s.slug)}">اختيار الباقة ←</a></article>`).join('')}</div>`}).join('');document.querySelector('#subscriptions').before(section)}catch{/* Static showcase remains available when the API is not running. */}})();


(async()=>{
 try{
  const response=await fetch('/api/contact');if(!response.ok)return;
  const contact=await response.json();
  const paths={
   whatsapp:'M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z',
   phone:'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.8.3 1.7.6 2.6.7a2 2 0 0 1 2 2.3Z',
   email:'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z M22 6l-10 7L2 6',
   hours:'M12 8v4l3 2',
   address:'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z'
  };
  const labels={whatsapp:'واتساب',phone:'الهاتف',email:'البريد الإلكتروني',hours:'أوقات العمل',address:'العنوان'};
  const block=document.createElement('section');block.className='footer-contact';block.setAttribute('aria-label','معلومات التواصل');
  const title=document.createElement('h3');title.textContent='معلومات التواصل';block.append(title);
  const grid=document.createElement('div');grid.className='contact-grid';block.append(grid);
  for(const key of ['whatsapp','phone','email','hours','address']){
   const value=String(contact[key]||'').trim();if(!value)continue;
   const actionable=['whatsapp','phone','email'].includes(key);
   const item=document.createElement(actionable?'a':'div');item.className='contact-detail';
   const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
   for(const [name,v] of Object.entries({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.7','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'}))svg.setAttribute(name,v);
   const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[key]);svg.append(path);
   if(key==='hours'||key==='address'){const circle=document.createElementNS(svg.namespaceURI,'circle');circle.setAttribute('cx','12');circle.setAttribute('cy',key==='hours'?'12':'10');circle.setAttribute('r',key==='hours'?'9':'2.5');svg.append(circle)}
   const icon=document.createElement('span');icon.className='contact-detail-icon';icon.append(svg);
   const info=document.createElement('span');info.className='contact-detail-info';
   const label=document.createElement('small');label.textContent=labels[key];
   const text=document.createElement('span');text.textContent=value;
   if(actionable)text.dir='ltr';
   info.append(label,text);item.append(icon,info);
   if(key==='email')item.href='mailto:'+value;
   if(key==='phone')item.href='tel:'+value.replace(/[^+0-9]/g,'');
   if(key==='whatsapp'){item.href='https://wa.me/'+value.replace(/[^0-9]/g,'');item.target='_blank';item.rel='noopener noreferrer';item.title='التواصل عبر واتساب'}
   grid.append(item);
  }
  if(grid.children.length)document.querySelector('.footer-top').append(block);
 }catch{}
})();
