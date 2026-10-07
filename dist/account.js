const api=OwaysAPI.request,E=OwaysAPI.escape,$=s=>document.querySelector(s),params=new URLSearchParams(location.search);let user,challenge,loginData,catalogData;let authMode='signup';const states={review:'قيد المراجعة',awaiting_customer:'بانتظار إجراء منك',ready:'جاهز للتنفيذ',processing:'قيد التنفيذ',completed:'مكتمل',cancelled:'ملغي',draft:'مسودة',awaiting_payment:'بانتظار الدفع',not_required_yet:'بانتظار عرض السعر',verification:'قيد التحقق',paid:'مدفوع'};function status(s){$('#status').textContent=s;if(!$('#auth-panel').hidden){$('#auth-feedback').classList.remove('error');$('#auth-feedback').hidden=!s;$('#auth-feedback-text').textContent=s;$('#auth-feedback-action').hidden=true}}async function run(fn){try{await fn()}catch(e){status(e.message);if(!$('#auth-panel').hidden){$('#auth-feedback').classList.add('error');const signup=e.message.includes('لا يوجد حساب بهذا الرقم'),login=e.message.includes('يوجد حساب بهذا الرقم')&&!signup;if(signup||login){const action=$('#auth-feedback-action');action.hidden=false;action.textContent=signup?'إنشاء حساب بهذا الرقم ←':'تسجيل الدخول بهذا الرقم ←';action.onclick=()=>{selectAuthMode(signup?'signup':'login');if(signup)$('#full-name-field input').focus();else $('#phone-number').focus()}}}}}
$('#login').onsubmit=e=>{e.preventDefault();run(async()=>{loginData={...Object.fromEntries(new FormData(e.target)),auth_mode:authMode};loginData.phone=internationalPhone();loginData.remember=e.target.elements.remember.checked;delete loginData.national_phone;challenge=await api('/api/auth/request',loginData);$('#verify-phone').textContent=loginData.phone;$('#auth-title').textContent='تأكيد رقم الهاتف';$('#auth-panel').classList.add('verifying');$('.auth-step').setAttribute('aria-label','الخطوة الثانية: التحقق من رقم الهاتف');$('#verify').hidden=false;$('#login').hidden=true;$('#auth-mode-link').hidden=true;status(challenge.delivery==='local_terminal'?'وضع التطوير المحلي: اقرأ رمز التحقق من طرفية الخادم.':'أُرسل رمز التحقق إلى رقمك.');$('#verify input').focus()})};$('#change-number').onclick=()=>{$('#login').hidden=false;$('#verify').hidden=true;$('#auth-mode-link').hidden=false;$('#verify').reset();$('#auth-panel').classList.remove('verifying');applyAuthMode(authMode);$('.auth-step').setAttribute('aria-label','الخطوة الأولى: بيانات الحساب')};$('#verify').onsubmit=e=>{e.preventDefault();run(async()=>{const r=await api('/api/auth/verify',{...loginData,challenge_id:challenge.challenge_id,code:new FormData(e.target).get('code')});user=r.user;window.dispatchEvent(new CustomEvent('oways:session',{detail:user}));await member()})};
async function member(){if(user.role==='admin'){location.replace('/admin');return}document.body.classList.remove('auth-view');$('#auth-panel').hidden=true;$('#member').hidden=false;$('#welcome').textContent='مرحبًا '+user.full_name;$('#admin-link').hidden=user.role!=='admin';status('');await listOrders();if(params.get('intent')==='support'){$('#support-panel').hidden=false;$('#support-reason').value=params.get('reason')||'استفسار عام'}if(params.get('service')){catalogData=await api('/api/catalog');const s=catalogData.services.find(s=>s.slug===params.get('service'));if(!s){$('#selection').hidden=false;$('#selection').textContent='هذه الخدمة لم تُضَف إلى كتالوج الإدارة بعد. يمكن للدعم مساعدتك.';$('#support-panel').hidden=false;$('#support-reason').value='أرغب في الخدمة: '+params.get('service');return}renderSelection(s)}}
function renderSelection(s){const panel=$('#selection');panel.hidden=false;panel.innerHTML=`<h2>${E(s.name)}</h2><label>اختر الباقة<select id="package">${s.packages.map(p=>`<option value="${E(p.id)}">${E(p.name)} — ${p.price===null?'عرض سعر':E(p.price)+' '+E(p.currency)}</option>`).join('')}</select></label><div id="requirements"></div>`;if(!s.packages.length){$('#requirements').textContent='لا توجد باقة متاحة حاليًا.';return}function fields(){const p=s.packages.find(p=>String(p.id)===$('#package').value);$('#requirements').innerHTML=`${p.instructions.filter(i=>i.stage==='before_order').map(i=>`<p class="portal-note">${E(i.body)}</p>`).join('')}<form id="order-form">${p.requirements.map(r=>`<label>${E(r.label)}${r.required?' *':''}${r.input_type==='select'?`<select name="${E(r.field_key)}" ${r.required?'required':''}><option value="">اختر</option>${(r.options_json||[]).map(v=>`<option>${E(v)}</option>`).join('')}</select>`:r.input_type==='textarea'?`<textarea name="${E(r.field_key)}" ${r.required?'required':''} maxlength="4000"></textarea>`:`<input name="${E(r.field_key)}" type="${({phone:'tel',number:'number',file:'text'})[r.input_type]||E(r.input_type)}" ${r.required?'required':''} maxlength="4000">`}<small>${E(r.help_text||'')}</small></label>`).join('')}<button class="button">حفظ الطلب والتواصل مع الدعم ←</button><p class="fine">الطلب لا يؤكد الدفع أو التفعيل.</p></form>`;$('#order-form').onsubmit=e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;run(async()=>{const o=await api('/api/orders',{package_id:p.id,answers:Object.fromEntries(new FormData(e.target))});panel.innerHTML=`<h2>تم حفظ طلبك ${E(o.public_reference)}</h2><p>يمكنك متابعة الطلب من حسابك.</p>`;await listOrders();await support({order_id:o.id})}).finally(()=>button.disabled=false)}}$('#package').onchange=fields;fields()}
async function listOrders(){const r=await api('/api/orders');$('#orders').innerHTML=r.orders.length?r.orders.map(o=>`<article class="portal-row"><div><b>${E(o.public_reference)}</b><small>${E(states[o.fulfillment_status]||o.fulfillment_status)} · ${E(states[o.payment_status]||o.payment_status)}</small></div><button class="button outline" data-details="${E(o.id)}">تفاصيل الطلب</button></article>`).join(''):'<p>لا توجد طلبات بعد. اختر خدمة من الصفحة الرئيسية.</p>'}
async function detail(id){const o=await api('/api/orders/'+id);$('#details').hidden=false;$('#details').innerHTML=`<h2>${E(o.public_reference)}</h2>${o.items.map(i=>`<h3>${E(i.package_snapshot.service_name)} — ${E(i.package_snapshot.name)}</h3><p>${E(states[i.fulfillment_status]||i.fulfillment_status)}</p>`).join('')}${o.updates.map(u=>`<p class="portal-note">${E(u.body)}</p>`).join('')}<button class="button" data-support="${E(o.id)}">متابعة الطلب مع الدعم ↗</button>`;$('#details').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
async function support(data){const r=await api('/api/support',data);$('#message-text').value=r.message;$('#whatsapp-link').hidden=!r.url;$('#no-whatsapp').hidden=!!r.url;if(r.url)$('#whatsapp-link').href=r.url;$('#support-message').showModal()}$('#general-support').onclick=()=>run(()=>support({reason:$('#support-reason').value}));$('#close-message').onclick=()=>$('#support-message').close();$('#copy-message').onclick=()=>run(async()=>{await navigator.clipboard.writeText($('#message-text').value);status('تم نسخ الرسالة.')});document.addEventListener('click',e=>{const d=e.target.closest('[data-details]'),s=e.target.closest('[data-support]');if(d)run(()=>detail(d.dataset.details));if(s)run(()=>support({order_id:s.dataset.support}))});run(async()=>{try{user=(await api('/api/auth/me')).user}catch(e){if(!e.message.includes('سجّل الدخول')&&!e.message.includes('انتهت الجلسة'))throw e}if(user)await member()});

function applyAuthMode(mode){authMode=mode;const signup=mode==='signup';$('#full-name-field').hidden=!signup;const name=$('#full-name-field input');name.disabled=!signup;name.required=signup;$('#login').classList.toggle('login-mode',!signup);$('#auth-mode-prompt').textContent=signup?'لديك حساب بالفعل؟':'ليس لديك حساب؟';$('#switch-auth-mode').textContent=signup?'تسجيل الدخول':'إنشاء حساب';$('#switch-auth-mode').href=signup?'/account?mode=login':'/account?mode=signup';$('#auth-title').textContent=signup?'إنشاء حساب':'تسجيل الدخول';$('#auth-help').textContent=signup?'أدخل اسمك ورقم هاتفك لإنشاء حساب جديد.':'أدخل رقم هاتفك. لن يُطلب رمز جديد أثناء بقاء جلستك محفوظة.';$('#login button[type="submit"],#login .auth-submit button').textContent=signup?'إنشاء حساب والتحقق ←':'تسجيل الدخول برمز التحقق ←';status('')}
let authTransition=0,authAnimations=[];
async function selectAuthMode(mode){
 const version=++authTransition;
 authAnimations.forEach(animation=>animation.cancel());authAnimations=[];
 const fields=$('.auth-fields'),intro=$('.auth-intro'),card=$('#auth-panel');
 if(matchMedia('(prefers-reduced-motion: reduce)').matches||typeof fields.animate!=='function'){applyAuthMode(mode);return}
 const oldHeight=card.getBoundingClientRect().height;
 const out=fields.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(6px)'}],{duration:110,easing:'ease-in',fill:'forwards'});authAnimations.push(out);
 try{await out.finished}catch{return}
 if(version!==authTransition)return;
 applyAuthMode(mode);out.cancel();
 const newHeight=card.getBoundingClientRect().height;
 const options={duration:240,easing:'cubic-bezier(.2,.7,.2,1)'};
 authAnimations=[
 fields.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],options),
 intro.animate([{opacity:.6},{opacity:1}],options),
 card.animate([{height:oldHeight+'px'},{height:newHeight+'px'}],options)
 ];
 await Promise.allSettled(authAnimations.map(animation=>animation.finished));
 if(version===authTransition)authAnimations=[];
}
$('#switch-auth-mode').onclick=e=>{e.preventDefault();selectAuthMode(authMode==='signup'?'login':'signup')};applyAuthMode(params.get('mode')==='login'?'login':'signup');

const callingCountries=[['SY','سوريا','963'],['LB','لبنان','961'],['JO','الأردن','962'],['IQ','العراق','964'],['SA','السعودية','966'],['AE','الإمارات','971'],['KW','الكويت','965'],['QA','قطر','974'],['BH','البحرين','973'],['OM','عُمان','968'],['YE','اليمن','967'],['PS','فلسطين','970'],['EG','مصر','20'],['SD','السودان','249'],['LY','ليبيا','218'],['TN','تونس','216'],['DZ','الجزائر','213'],['MA','المغرب','212'],['TR','تركيا','90'],['DE','ألمانيا','49'],['NL','هولندا','31'],['RO','رومانيا','40'],['FR','فرنسا','33'],['GB','المملكة المتحدة','44'],['US','الولايات المتحدة','1'],['CA','كندا','1'],['AU','أستراليا','61'],['OTHER','مفتاح آخر','']];

const countryLabel=([iso,name,code])=>name+(code?' (+'+code+')':'');
$('#country-code').innerHTML=callingCountries.map(c=>'<option value="'+c[0]+'">'+countryLabel(c)+'</option>').join('');
$('#country-options').innerHTML=callingCountries.map(c=>'<option value="'+countryLabel(c)+'"></option>').join('');
function digits(value){return value.replace(/[٠-٩۰-۹]/g,c=>String(c.charCodeAt(0)>=1776?c.charCodeAt(0)-1776:c.charCodeAt(0)-1632)).replace(/[^0-9]/g,'')}
let suggested='';for(const language of navigator.languages||[navigator.language]){try{const region=new Intl.Locale(language).region;if(callingCountries.some(c=>c[0]===region)){suggested=region;break}}catch{}}
let selectedCountry=callingCountries.find(c=>c[0]===(suggested||'SY')),previousCode=selectedCountry[2];
$('#country-code').value=selectedCountry[0];$('#country-picker').value=countryLabel(selectedCountry);$('#phone-number').value=previousCode;
$('#country-hint').textContent='ابحث عن الدولة، ثم أكمل رقم هاتفك بعد المفتاح. أرقام فقط.';
const customLabel=document.createElement('label');customLabel.className='custom-calling-code';customLabel.hidden=true;customLabel.innerHTML='مفتاح الدولة<input id="custom-country-code" inputmode="numeric" dir="ltr" placeholder="مثال: 39" maxlength="3">';$('.phone-field').append(customLabel);
function changeCountry(country){
 let number=digits($('#phone-number').value);
 if(previousCode&&number.startsWith(previousCode))number=number.slice(previousCode.length);
 selectedCountry=country;$('#country-code').value=country[0];previousCode=country[2];
 customLabel.hidden=country[0]!=='OTHER';
 $('#phone-number').value=(previousCode+number.replace(/^0+/,'' )).slice(0,15);
 $('#country-picker').setCustomValidity('');
}
$('#country-picker').addEventListener('input',()=>{
 const country=callingCountries.find(c=>countryLabel(c)===$('#country-picker').value);
 $('#country-picker').setCustomValidity(country?'':'اختر دولة من نتائج البحث.');
 if(country)changeCountry(country);
});
$('#country-picker').addEventListener('focus',()=>$('#country-picker').select());
$('#country-picker').addEventListener('blur',()=>{
 const country=callingCountries.find(c=>countryLabel(c)===$('#country-picker').value);
 if(!country){$('#country-picker').value=countryLabel(selectedCountry);$('#country-picker').setCustomValidity('')}
});
$('#phone-number').addEventListener('input',()=>{
 const input=$('#phone-number'),position=input.selectionStart,raw=input.value;
 const before=digits(raw.slice(0,position)).length;
 input.value=digits(raw).slice(0,15);input.setSelectionRange(before,before);
});
$('#custom-country-code').addEventListener('input',()=>{
 const input=$('#custom-country-code');input.value=digits(input.value).slice(0,3);
 let number=digits($('#phone-number').value);
 if(previousCode&&number.startsWith(previousCode))number=number.slice(previousCode.length);
 previousCode=input.value;$('#phone-number').value=(previousCode+number).slice(0,15);
});
function internationalPhone(){
 const number=digits($('#phone-number').value),code=selectedCountry[0]==='OTHER'?$('#custom-country-code').value:selectedCountry[2];
 if(!/^[1-9][0-9]{0,2}$/.test(code))throw Error('مفتاح الدولة غير صالح.');
 if(!number.startsWith(code))throw Error('يجب أن يبدأ رقم الهاتف بمفتاح الدولة '+code+'.');
 const national=number.slice(code.length).replace(/^0+/,'');
 const full='+'+code+national;
 if(!/^\+[1-9][0-9]{7,14}$/.test(full)||!national)throw Error('أكمل رقم هاتفك بعد مفتاح الدولة.');
 return full;
}

$('#verify input').addEventListener('input',e=>{e.target.value=digits(e.target.value).slice(0,6)});
