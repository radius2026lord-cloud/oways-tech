import {scrypt as derive,randomBytes,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(derive);
export async function hashPassword(password){if(typeof password!=='string'||password.length<12||password.length>128)throw Error('كلمة المرور يجب أن تكون من 12 إلى 128 حرفًا.');const salt=randomBytes(16).toString('hex');const key=await scrypt(password,salt,64);return salt+':'+key.toString('hex')}
export async function verifyPassword(password,stored){if(typeof password!=='string'||password.length>128)return false;const [salt,value]=stored.split(':');const expected=Buffer.from(value,'hex');const actual=await scrypt(password,salt,64);return expected.length===actual.length&&timingSafeEqual(expected,actual)}
