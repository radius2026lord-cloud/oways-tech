// HTTP workflow fixture only: does not verify MySQL dialect, schema or connectivity.
import {hashPassword} from '../../server/password.js';
let state={users:[{id:1,full_name:'Test Admin',phone:null,role:'admin',status:'active'},{id:2,full_name:'Customer One',phone:'+963944111111',role:'customer',status:'active'},{id:3,full_name:'Customer Two',phone:'+963944222222',role:'customer',status:'active'}],credentials:{1:await hashPassword('Admin!234'),2:await hashPassword('Customer!234'),3:await hashPassword('Customer!234')},services:[{id:1,category_id:1,name:'Test Service',slug:'test-service',description:'Original',features:[],kind:'subscription',images:[],status:'active'}],packages:[{id:1,service_id:1,name:'One Month',pricing_mode:'fixed',price:10,currency:'USD',duration_value:1,duration_unit:'month',status:'active'}],requirements:[],instructions:[],sessions:[],orders:[{id:1,user_id:2,public_reference:'OT-TEST-ONE',fulfillment_status:'review',payment_status:'awaiting_payment',total_amount:'10.00',currency:'USD'}],payments:[],audit:[],visitors:new Map(),items:[{id:1,order_id:1,package_id:1,package_snapshot:{service_name:'Test Service',name:'One Month'},fulfillment_status:'review'}]};
export const pool={async end(){}};
const copy=v=>structuredClone(v),hex=v=>Buffer.from(v).toString('hex'),same=(a,b)=>String(a)===String(b);
export async function transaction(fn){const before=copy(state);try{return await fn({})}catch(e){state=before;throw e}}
export async function rows(sql,args=[]){
if(sql.startsWith('SELECT s.*,c.name AS category_name'))return copy(state.services.filter(s=>s.status!=='archived').map(s=>({...s,category_name:'Digital'})));
if(sql.startsWith('SELECT s.id,s.name,s.status,COUNT'))return state.services.map(s=>({id:s.id,name:s.name,status:s.status,order_count:state.orders.filter(o=>!['cancelled','draft'].includes(o.fulfillment_status)&&state.items.some(i=>same(i.order_id,o.id)&&state.packages.some(p=>same(p.id,i.package_id)&&same(p.service_id,s.id)))).length}));
if(sql.startsWith('SELECT * FROM services WHERE id='))return copy(state.services.filter(s=>same(s.id,args[0])&&s.status!=='archived'));
if(sql.startsWith('SELECT id FROM services WHERE id='))return state.services.filter(s=>same(s.id,args[0])&&s.status!=='archived').map(s=>({id:s.id}));
if(sql.startsWith('SELECT * FROM service_packages'))return copy(state.packages.filter(p=>p.status!=='archived'&&(!sql.includes('service_id=?')||same(p.service_id,args[0]))));
if(sql.startsWith('SELECT id FROM service_packages'))return state.packages.filter(p=>same(p.id,args[0])&&same(p.service_id,args[1])&&p.status!=='archived').map(p=>({id:p.id}));
if(sql.startsWith('SELECT * FROM package_requirements'))return copy(state.requirements.filter(r=>same(r.package_id,args[0])));
if(sql.startsWith('SELECT * FROM package_instructions'))return copy(state.instructions.filter(r=>same(r.package_id,args[0])));
if(sql.startsWith('UPDATE services SET category_id=')){const x=state.services.find(s=>same(s.id,args[7]));for(const [i,key]of ['category_id','name','slug','description','features','kind','images'].entries())x[key]=['features','images'].includes(key)?JSON.parse(args[i]):args[i];return {affectedRows:1}}
if(sql.startsWith('UPDATE service_packages SET name=')){const x=state.packages.find(p=>same(p.id,args[7]));for(const [i,key]of ['name','pricing_mode','price','currency','duration_value','duration_unit','activation_method'].entries())x[key]=args[i];return {affectedRows:1}}
if(sql.startsWith('DELETE FROM package_requirements')){state.requirements=state.requirements.filter(r=>!same(r.package_id,args[0]));return {affectedRows:1}}
if(sql.startsWith('DELETE FROM package_instructions')){state.instructions=state.instructions.filter(r=>!same(r.package_id,args[0]));return {affectedRows:1}}
if(sql.startsWith("UPDATE services SET status='archived'")){state.services.find(s=>same(s.id,args[0])).status='archived';return {affectedRows:1}}
if(sql.startsWith("UPDATE service_packages SET status='archived'")){state.packages.filter(p=>same(p.service_id,args[0])).forEach(p=>p.status='archived');return {affectedRows:1}}
if(sql==='SELECT 1')return [{one:1}];
if(sql.startsWith('SELECT u.id,u.full_name,u.phone,u.role FROM user_sessions')){const session=state.sessions.find(s=>s.digest===hex(args[0])&&!s.revoked&&s.expires>Date.now());const u=session&&state.users.find(u=>same(u.id,session.user_id)&&u.status==='active');return u?[copy(u)]:[]}
if(sql.includes('FROM admin_credentials a JOIN users')){return args[0]==='test_admin'?[{...copy(state.users[0]),password_hash:state.credentials[1]}]:[]}
if(sql.startsWith('SELECT u.id,u.full_name,u.phone,u.role,u.status,c.password_hash')){const u=state.users.find(u=>u.phone===args[0]);return u?[{...copy(u),password_hash:state.credentials[u.id]}]:[]}
if(sql==='SELECT id FROM users WHERE phone=?'){return state.users.filter(u=>u.phone===args[0]).map(u=>({id:u.id}))}
if(sql.startsWith('INSERT INTO users(full_name,phone,role)')){const id=Math.max(...state.users.map(u=>u.id))+1;state.users.push({id,full_name:args[0],phone:args[1],role:'customer',status:'active'});return {insertId:id}}
if(sql.startsWith('INSERT INTO customer_credentials')){state.credentials[args[0]]=args[1];return {affectedRows:1}}
if(sql.startsWith('INSERT INTO user_sessions')){state.sessions.push({user_id:args[0],digest:hex(args[1]),expires:Date.now()+Number(args[2])*86400000,revoked:false});return {affectedRows:1}}
if(sql.startsWith('UPDATE user_sessions')){state.sessions.filter(s=>sql.includes('WHERE user_id=')?same(s.user_id,args[0]):s.digest===hex(args[0])).forEach(s=>s.revoked=true);return {affectedRows:1}}
if(sql.startsWith('INSERT INTO audit_logs')){state.audit.push({actor:args[0],entity:args[1],id:args[2],action:args[3]});return {affectedRows:1}}
if(sql.startsWith('SELECT id FROM users WHERE id=')){return state.users.filter(u=>same(u.id,args[0])&&u.role==='customer'&&u.status==='active').map(u=>({id:u.id}))}
if(sql.startsWith('SELECT u.id,u.full_name,u.phone,u.created_at')){return state.users.filter(u=>u.role==='customer').map(u=>({...copy(u),has_password:!!state.credentials[u.id]}))}
if(sql.startsWith('SELECT * FROM orders WHERE id=? AND user_id=?'))return copy(state.orders.filter(o=>same(o.id,args[0])&&same(o.user_id,args[1])));
if(sql.startsWith('SELECT * FROM orders WHERE id=?'))return copy(state.orders.filter(o=>same(o.id,args[0])));
if(sql.startsWith('SELECT id,public_reference,fulfillment_status'))return copy(state.orders.filter(o=>same(o.user_id,args[0])));
if(sql.startsWith('SELECT * FROM order_items WHERE order_id=?'))return copy(state.items.filter(i=>same(i.order_id,args[0])));
if(sql.startsWith('SELECT body,created_at FROM order_updates'))return [];
if(sql.startsWith('INSERT INTO manual_payment_confirmations')){if(state.payments.some(p=>same(p.order_id,args[0])))throw Error('Duplicate confirmation');state.payments.push({order_id:args[0],admin:args[1]});return {affectedRows:1}}
if(sql.startsWith("UPDATE orders SET payment_status='paid'")){state.orders.find(o=>same(o.id,args[0])).payment_status='paid';return {affectedRows:1}}
if(sql.startsWith('UPDATE orders SET fulfillment_status')){state.orders.find(o=>same(o.id,args[1])).fulfillment_status=args[0];return {affectedRows:1}}
if(sql.startsWith('UPDATE order_items SET fulfillment_status')){state.items.filter(i=>same(i.order_id,args[1])).forEach(i=>i.fulfillment_status=args[0]);return {affectedRows:1}}
if(sql.startsWith('INSERT INTO order_updates'))return {affectedRows:1};
if(sql.startsWith('INSERT INTO visitor_daily')){const key=hex(args[0]);state.visitors.set(key,(state.visitors.get(key)||0)+1);return {affectedRows:1}}
if(sql.startsWith('SELECT COUNT(DISTINCT visitor_digest)'))return [{unique_visitors:state.visitors.size,today_visitors:state.visitors.size,month_visitors:state.visitors.size,page_views:[...state.visitors.values()].reduce((a,b)=>a+b,0)}];
if(sql.startsWith('SELECT DATE_FORMAT(visit_date'))return [];
throw Error('Unexpected fixture SQL: '+sql);
}
