export function discountPercent(value=0){
 if(!/^\d{1,3}$/.test(String(value))||Number(value)>100)throw Error('الحسم يجب أن يكون عددًا صحيحًا من 0 إلى 100.');
 return Number(value);
}
export function pricedPackage(p,offer={}){
 const percent=p.pricing_mode==='fixed'?discountPercent(offer.discount_percent??0):0;
 if(p.pricing_mode!=='fixed'||p.price===null)return {...p,discount_percent:0,original_price:null,final_price:null};
 const cents=Math.round(Number(p.price)*100);
 return {...p,discount_percent:percent,original_price:(cents/100).toFixed(2),final_price:(Math.round(cents*(100-percent)/100)/100).toFixed(2)};
}
