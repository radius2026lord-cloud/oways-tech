import {createInterface} from 'node:readline';
import {Writable} from 'node:stream';
import {pool,rows,transaction} from '../server/db.js';
import {hashPassword} from '../server/password.js';
let muted=false;const output=new Writable({write(chunk,encoding,done){if(!muted)process.stdout.write(chunk);done()}});
let rl;
const ask=(label,hidden=false)=>new Promise(resolve=>{process.stdout.write(label);muted=hidden;rl.question('',answer=>{muted=false;if(hidden)process.stdout.write('\n');resolve(answer)})});
try{
console.log('Checking database connection…');
const db=await pool.getConnection();
try{
await db.query({sql:'SELECT 1',timeout:10000});
await db.query('SET SESSION lock_wait_timeout=10');
console.log('Preparing admin tables…');
const [columns]=await db.query("SELECT IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='phone'");
if(!columns.length)throw Error('The users table is missing. Check DB_NAME.');
if(columns[0].IS_NULLABLE==='NO')await db.query({sql:"ALTER TABLE users MODIFY phone VARCHAR(16) CHARACTER SET ascii NULL COMMENT 'International E.164, including +'",timeout:15000});
await db.query({sql:"CREATE TABLE IF NOT EXISTS admin_credentials (user_id BIGINT UNSIGNED PRIMARY KEY,username VARCHAR(64) CHARACTER SET ascii NOT NULL UNIQUE,password_hash VARCHAR(200) CHARACTER SET ascii NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id)) ENGINE=InnoDB",timeout:15000});
await db.query({sql:"CREATE TABLE IF NOT EXISTS manual_payment_confirmations (order_id BIGINT UNSIGNED PRIMARY KEY,confirmed_by BIGINT UNSIGNED NOT NULL,amount DECIMAL(12,2) NOT NULL,currency CHAR(3) CHARACTER SET ascii NOT NULL,confirmed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(order_id) REFERENCES orders(id),FOREIGN KEY(confirmed_by) REFERENCES users(id)) ENGINE=InnoDB",timeout:15000});
}finally{db.release()}
console.log('Database ready. Enter your admin details below.');
rl=createInterface({input:process.stdin,output,terminal:!!process.stdin.isTTY});
const username=(await ask('Admin username: ')).trim().toLowerCase();if(!/^[a-z][a-z0-9_.-]{2,63}$/.test(username))throw Error('Username must be 3–64 English characters.');
const name=(await ask('Display name: ')).trim();if(!name||name.length>160)throw Error('Display name required (max 160).');
const password=await ask('Password (12–128 characters): ',true);if(password!==await ask('Confirm password: ',true))throw Error('Passwords do not match.');const passwordHash=await hashPassword(password);
await transaction(async db=>{if((await rows('SELECT user_id FROM admin_credentials WHERE username=?',[username],db)).length)throw Error('Username already exists.');const u=await rows("INSERT INTO users(full_name,phone,role) VALUES(?,NULL,'admin')",[name],db);await rows('INSERT INTO admin_credentials(user_id,username,password_hash) VALUES(?,?,?)',[u.insertId,username,passwordHash],db);await rows("INSERT INTO audit_logs(actor_id,entity_type,entity_id,action) VALUES(?,'user',?,'admin_created')",[u.insertId,u.insertId],db)});
console.log('Admin created. Open /admin-login');
}catch(error){console.error('Admin setup failed:',error.code||error.message);if(['ER_LOCK_WAIT_TIMEOUT','PROTOCOL_SEQUENCE_TIMEOUT'].includes(error.code))console.error('Stop npm start and close open database transactions, then retry.');else if(['ER_ACCESS_DENIED_ERROR','ER_DBACCESS_DENIED_ERROR','ER_TABLEACCESS_DENIED_ERROR'].includes(error.code))console.error('Check database permissions: setup needs CREATE and ALTER.');process.exitCode=1;}finally{rl?.close();await pool.end()}
