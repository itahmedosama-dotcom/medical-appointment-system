/**
 * auth.js
 * حماية بسيطة على مستوى الواجهة: يمنع فتح الصفحات الداخلية بدون تسجيل دخول،
 * ويخفي روابط القائمة الجانبية وأزرار التعديل حسب صلاحيات المستخدم.
 * ملاحظة: هذه حماية واجهة لتحسين التجربة فقط — الحماية الحقيقية الحاسمة
 * (خصوصًا لإدارة المستخدمين والإعدادات) موجودة على مستوى الخادم في apps-script/.
 */

function requireAuth(){
  const raw = localStorage.getItem('mas_user');
  if(!raw){
    window.location.href = 'login.html';
    return null;
  }
  try{
    const user = JSON.parse(raw);
    applySidebarPermissions(user);
    return user;
  } catch(e){
    window.location.href = 'login.html';
    return null;
  }
}

function currentUser(){
  try{ return JSON.parse(localStorage.getItem('mas_user')); } catch(e){ return null; }
}

/** يتحقق هل المستخدم الحالي عنده صلاحية معيّنة (patients/providers/services/appointments/reports/settings/permissions) */
function hasPermission(key){
  const user = currentUser();
  if(!user) return false;
  // توافقًا مع حسابات قديمة أُنشئت قبل نظام الصلاحيات ومفيش عندها كائن permissions
  if(!user.permissions) return true;
  return !!user.permissions[key];
}

/**
 * تمنع فتح صفحة كاملة لمن ليس لديه الصلاحية المطلوبة — تعرض تنبيهًا وتُرجعه للرئيسية.
 * تُستدعى في أعلى سكربت أي صفحة حسّاسة (مثل permissions.html) بعد requireAuth().
 */
function requirePermission(key){
  if(hasPermission(key)) return true;
  if(typeof Swal !== 'undefined'){
    Swal.fire({
      icon:'warning',
      title: typeof t === 'function' ? t('noPermissionTitle') : 'ليس لديك صلاحية',
      text: typeof t === 'function' ? t('noPermissionText') : 'ليس لديك صلاحية الوصول لهذه الصفحة.',
      confirmButtonColor:'#14685E'
    }).then(() => { window.location.href = 'index.html'; });
  } else {
    alert('ليس لديك صلاحية الوصول لهذه الصفحة');
    window.location.href = 'index.html';
  }
  return false;
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

/** يخفي أي رابط في القائمة الجانبية عليه data-perm="key" لو المستخدم مايملكش هذه الصلاحية */
function applySidebarPermissions(user){
  if(!user) return;
  document.querySelectorAll('.sidebar-nav a[data-perm]').forEach(link => {
    const key = link.getAttribute('data-perm');
    if(!hasPermission(key)) link.style.display = 'none';
  });
}

document.addEventListener('DOMContentLoaded', renderUserChip);
