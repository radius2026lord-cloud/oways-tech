export const SESSION_DAYS=1,REMEMBER_DAYS=30;
export function sessionDays(remember){return remember===true?REMEMBER_DAYS:SESSION_DAYS}
export function sessionCookie(token,remember,production){return `oways_session=${token}; HttpOnly; SameSite=Lax; Path=/${remember===true?'; Max-Age='+REMEMBER_DAYS*86400:''}${production?'; Secure':''}`}
