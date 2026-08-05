/**
 * auth.js
 * حماية بسيطة على مستوى الواجهة: يمنع فتح الصفحات الداخلية بدون تسجيل دخول.
 * ملاحظة: هذه حماية واجهة فقط، وليست بديلاً عن حماية حقيقية في الـ API.
 */

function requireAuth(){
  const raw = localStorage.getItem('mas_user');
  if(!raw){
    window.location.href = 'login.html';
    return null;
  }
  try{
    return JSON.parse(raw);
  } catch(e){
    window.location.href = 'login.html';
    return null;
  }
}

function currentUser(){
  try{ return JSON.parse(localStorage.getItem('mas_user')); } catch(e){ return null; }
}

function logout(){
  localStorage.removeItem('mas_user');
  window.location.href = 'login.html';
}

function renderUserChip(){
  const user = currentUser();
  if(!user) return;
  const initialsEl = document.querySelector('.avatar-chip .initials');
  const nameEl = document.querySelector('.avatar-chip .who .n');
  const roleEl = document.querySelector('.avatar-chip .who .r');
  if(initialsEl) initialsEl.textContent = (user.name || '').trim().slice(0, 2) || '؟؟';
  if(nameEl) nameEl.textContent = user.name || user.username;
  if(roleEl) roleEl.textContent = user.role || '';
}

document.addEventListener('DOMContentLoaded', renderUserChip);
