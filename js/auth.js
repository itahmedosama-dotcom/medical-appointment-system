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
    initSessionTimeout(user);
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

/* ============================================================
   خروج تلقائي عند الخمول (Idle Session Timeout)
   - مدة الجلسة تُضبط لكل مستخدم من صفحة "الصلاحيات" (بالدقائق).
   - عدّاد ظاهر في أعلى الشاشة يوضّح الوقت المتبقي.
   - أي حركة ماوس/لوحة مفاتيح/لمس ترجّع العدّاد من الأول.
   - عند الوصول للصفر: تنبيه ثم تسجيل خروج تلقائي.
   ============================================================ */
let __sessionMinutes = 30;
let __sessionEndAt = null;
let __sessionTickHandle = null;
let __sessionExpired = false;

function initSessionTimeout(user){
  if(!user) return;
  __sessionMinutes = Number(user.sessionMinutes) > 0 ? Number(user.sessionMinutes) : 30;
  __sessionExpired = false;

  renderSessionBadge();
  resetSessionTimer();

  const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
  activityEvents.forEach(evt => document.addEventListener(evt, resetSessionTimer, { passive: true }));

  if(__sessionTickHandle) clearInterval(__sessionTickHandle);
  __sessionTickHandle = setInterval(tickSessionTimer, 1000);
}

function resetSessionTimer(){
  if(__sessionExpired) return;
  __sessionEndAt = Date.now() + (__sessionMinutes * 60 * 1000);
}

function tickSessionTimer(){
  if(!__sessionEndAt || __sessionExpired) return;
  const remainingMs = __sessionEndAt - Date.now();

  if(remainingMs <= 0){
    __sessionExpired = true;
    clearInterval(__sessionTickHandle);
    const title = typeof t === 'function' ? t('sessionExpiredTitle') : 'انتهت الجلسة';
    const text = typeof t === 'function' ? t('sessionExpiredText') : 'تم تسجيل خروجك تلقائيًا بسبب عدم النشاط.';
    if(typeof Swal !== 'undefined'){
      Swal.fire({ icon:'info', title, text, confirmButtonColor:'#14685E', allowOutsideClick:false }).then(logout);
    } else {
      alert(text);
      logout();
    }
    return;
  }

  const totalSec = Math.ceil(remainingMs / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  const textEl = document.getElementById('sessionTimerText');
  if(textEl) textEl.textContent = `${mm}:${ss}`;
  const badgeEl = document.getElementById('sessionTimerBadge');
  if(badgeEl) badgeEl.classList.toggle('session-timer-warning', totalSec <= 60);
}

/** يبني ويحقن شارة العدّاد في الشريط العلوي لأي صفحة، بدون أي تعديل يدوي على كل صفحة */
function renderSessionBadge(){
  if(document.getElementById('sessionTimerBadge')) return;
  const topbarRight = document.querySelector('.app-topbar .ms-auto');
  if(!topbarRight) return;
  const badge = document.createElement('div');
  badge.id = 'sessionTimerBadge';
  badge.className = 'session-timer-badge';
  badge.title = typeof t === 'function' ? t('sessionRemaining') : 'الوقت المتبقي للجلسة';
  badge.innerHTML = `<i class="fa-regular fa-clock"></i> <span id="sessionTimerText">--:--</span>`;
  topbarRight.insertBefore(badge, topbarRight.firstChild);
}

document.addEventListener('DOMContentLoaded', renderUserChip);
