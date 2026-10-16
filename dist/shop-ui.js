(()=>{
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const units={day:'يوم',week:'أسبوع',month:'شهر',year:'سنة'};
function duration(p){return p.duration_value&&units[p.duration_unit]?' / '+p.duration_value+' '+units[p.duration_unit]:''}
function price(p){if(p.price==null||p.pricing_mode==='quote')return '<span>حسب عرض السعر</span>';return '<span class="price-display">'+(p.discount_percent?'<del aria-label="السعر السابق">'+escape(p.original_price)+' '+escape(p.currency)+'</del>':'')+'<strong><bdi>'+escape(p.final_price??p.price)+' '+escape(p.currency)+'</bdi></strong><small>'+escape(duration(p))+'</small>'+(p.discount_percent?'<span class="discount-badge">حسم '+escape(p.discount_percent)+'%</span>':'')+'</span>'}
function favorites(){try{const list=JSON.parse(localStorage.getItem('oways:favorites')||'[]');return new Set(Array.isArray(list)?list.filter(x=>typeof x==='string').slice(0,500):[])}catch{return new Set()}}
function toggleFavorite(slug){const list=favorites();if(list.has(slug))list.delete(slug);else if(list.size<500)list.add(slug);try{localStorage.setItem('oways:favorites',JSON.stringify([...list]))}catch{return false}window.dispatchEvent(new Event('oways:favorites'));return true}
function favoriteButton(slug,name){const on=favorites().has(slug);return '<button type="button" class="favorite-button" data-favorite="'+escape(slug)+'" aria-pressed="'+on+'" aria-label="'+escape((on?'إزالة من المفضلة: ':'إضافة للمفضلة: ')+name)+'"><svg viewBox="0 0 24 24" fill="'+(on?'currentColor':'none')+'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg></button>'}
window.OwaysShop={price,duration,favorites,toggleFavorite,favoriteButton};
})();
