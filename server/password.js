import {scrypt as derive,randomBytes,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(derive);
export function validatePassword(password){if(typeof password!=='string'||password.length<6||password.length>128)throw Error('كلمة المرور يجب أن تكون من 6 إلى 128 محرفًا.');if(!/^[!-~]+$/.test(password))throw Error('كلمة المرور تقبل الحروف الإنجليزية والأرقام والرموز فقط، دون مسافات أو أحرف عربية.');return password}
export async function hashPassword(password){validatePassword(password);const salt=randomBytes(16).toString('hex');const key=await scrypt(password,salt,64);return salt+':'+key.toString('hex')}
export async function verifyPassword(password,stored){if(typeof password!=='string'||! /^[!-~]{6,128}$/.test(password))return false;if(typeof stored!=='string'||! /^[a-f0-9]{32}:[a-f0-9]{128}$/.test(stored))return false;const [salt,value]=stored.split(':');const expected=Buffer.from(value,'hex');const actual=await scrypt(password,salt,64);return expected.length===actual.length&&timingSafeEqual(expected,actual)}
