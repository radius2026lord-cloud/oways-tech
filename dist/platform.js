// Use capture to gate every existing request/support action before any old local handler.
document.addEventListener('click',e=>{const service=e.target.closest('[data-add]'),support=e.target.closest('[data-contact]');if(service||support){e.preventDefault();e.stopImmediatePropagation();location.href=service?'/service?slug='+encodeURIComponent(service.dataset.add):'/account?intent=support&reason='+encodeURIComponent(support.dataset.contact)}},true);
const checkout=document.querySelector('#checkout');checkout.onclick=()=>{location.href='/account'};
document.querySelector('#renew-form').onsubmit=e=>{e.preventDefault();location.href='/account?intent=support&reason='+encodeURIComponent('طلب تجديد '+document.querySelector('#service').value+' — '+document.querySelector('#reference').value)};
(async()=>{
try{
const response=await fetch('/api/catalog');if(!response.ok)return;
const data=await response.json();if(!data.services.length)return;
const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categories=data.categories.filter(c=>data.services.some(s=>String(s.category_id)===String(c.id)));
const section=document.createElement('section');section.className='section wrap shop-catalog';section.id='managed-services';
section.innerHTML='<div class="section-head"><div><div class="eyebrow">خدمات المنصة</div><h2>اشتراكات وخدمات <span>تناسبك.</span></h2></div></div><div class="catalog-search"><label for="catalog-query">ابحث عن خدمة</label><input id="catalog-query" type="search" placeholder="اسم الخدمة أو وصفها…" autocomplete="off"></div><div class="catalog-filters" role="group" aria-label="تصفية الخدمات حسب التصنيف"></div><p id="catalog-results" class="fine" role="status"></p><div id="catalog-groups"></div>';
document.querySelector('#subscriptions').before(section);
let selected='',query='';
const filters=section.querySelector('.catalog-filters');
filters.innerHTML=[{id:'',name:'جميع الخدمات'},...categories].map(c=>'<button class="catalog-filter" type="button" data-category="'+e(c.id)+'" aria-pressed="'+(c.id===''?'true':'false')+'">'+e(c.name)+'</button>').join('');
function card(s){
const packages=s.packages||[],fixed=packages.filter(p=>p.pricing_mode==='fixed'&&p.price!==null);
const currency=fixed[0]?.currency,prices=fixed.filter(p=>p.currency===currency).map(p=>Number(p.price)).filter(Number.isFinite);
const price=prices.length?'<bdi>'+e(Math.min(...prices))+' '+e(currency)+'</bdi>':'حسب عرض السعر';
const images=typeof s.images==='string'?JSON.parse(s.images):s.images;
return '<article class="shop-service-card"><a class="shop-service-image" href="/service?slug='+encodeURIComponent(s.slug)+'" aria-label="'+e('تفاصيل '+s.name)+'">'+(images?.[0]?.src?'<img src="'+e(images[0].src)+'" alt="'+e(images[0].alt||s.name)+'" loading="lazy" decoding="async">':'<span class="shop-image-placeholder">'+e(s.name)+'</span>')+'</a><div class="shop-service-content"><h3>'+e(s.name)+'</h3><p>'+e(s.description||'')+'</p><div class="shop-service-price">'+(prices.length&&packages.length>1?'<small>ابتداءً من </small>':'')+price+'</div><a class="button" href="/service?slug='+encodeURIComponent(s.slug)+'">التفاصيل والباقات <span aria-hidden="true">←</span></a></div></article>';
}
function render(){
const normalize=v=>String(v||'').normalize('NFKC').toLocaleLowerCase();
const services=data.services.filter(s=>(!selected||String(s.category_id)===selected)&&(!query||normalize(s.name+' '+s.description+' '+(s.features||[]).join(' ')).includes(normalize(query))));
section.querySelector('#catalog-results').textContent='عرض '+services.length+' من '+data.services.length+' خدمة';
section.querySelector('#catalog-groups').innerHTML=services.length?categories.filter(c=>!selected||String(c.id)===selected).map(c=>{const items=services.filter(s=>String(s.category_id)===String(c.id));if(!items.length)return '';return '<section class="shop-category"><div class="shop-category-heading"><h3>'+e(c.name)+'</h3><span>'+items.length+' خدمات</span></div><div class="shop-service-grid">'+items.map(card).join('')+'</div></section>';}).join(''):'<div class="admin-empty"><h3>لا توجد خدمات مطابقة</h3><p>جرّب اسمًا آخر أو اختر جميع الخدمات.</p><button type="button" class="button outline" id="catalog-clear">مسح البحث والفلترة</button></div>';
filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===selected)));
const clear=section.querySelector('#catalog-clear');if(clear)clear.onclick=()=>{selected='';query='';section.querySelector('#catalog-query').value='';render()};
}
filters.addEventListener('click',event=>{const button=event.target.closest('[data-category]');if(!button)return;selected=button.dataset.category;render()});
section.querySelector('#catalog-query').addEventListener('input',event=>{query=event.target.value.trim();render()});
render();
}catch{/* Keep the existing showcase available if the catalog cannot load. */}
})();


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
