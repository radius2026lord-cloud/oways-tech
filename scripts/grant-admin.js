import {pool,rows} from '../server/db.js';import {phone} from '../server/validation.js';
try{const p=phone(process.argv[2]);const r=await rows("UPDATE users SET role='admin' WHERE phone=? AND phone_verified_at IS NOT NULL",[p]);if(!r.affectedRows)throw Error('Register and verify this phone first.');console.log('Admin access granted.')}finally{await pool.end()}
