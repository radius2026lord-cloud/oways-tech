import {api} from './api.js';
const form=document.querySelector('#admin-login-form'),feedback=document.querySelector('#login-feedback'),button=form.querySelector('button');
api('/api/auth/me').then(({user})=>{if(user.role==='admin')location.replace('/admin')}).catch(()=>{});
form.onsubmit=async e=>{e.preventDefault();if(button.disabled)return;feedback.hidden=true;button.disabled=true;button.textContent='جارٍ تسجيل الدخول…';try{await api('/api/auth/admin-login',{username:form.elements.username.value.trim(),password:form.elements.password.value,remember:form.elements.remember.checked});location.replace('/admin')}catch(error){feedback.textContent=error.message;feedback.hidden=false;form.elements.password.value='';form.elements.password.focus()}finally{button.disabled=false;button.textContent='دخول لوحة الإدارة ←'}};
form.elements.username.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();form.elements.password.focus()}});
