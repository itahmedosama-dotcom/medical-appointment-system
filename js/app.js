/* ============================================================
   app.js — سلوك واجهة عام مشترك بين كل الصفحات.
   منطق البيانات الفعلي (CRUD) موجود داخل كل صفحة + api.js،
   وهذا الملف مسؤول فقط عن سلوك واجهة عام (القائمة الجانبية على الموبايل).
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initSidebarToggle();
});

// تسجيل الـ Service Worker لتفعيل خاصية التثبيت على الجوال (PWA)
if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

function initSidebarToggle(){
  const sidebar = document.querySelector('.app-sidebar');
  const openBtn = document.querySelector('[data-toggle="sidebar"]');
  const backdrop = document.querySelector('.sidebar-backdrop');
  if(!sidebar || !openBtn || !backdrop) return;

  const close = () => { sidebar.classList.remove('open'); backdrop.classList.remove('show'); };
  openBtn.addEventListener('click', () => {
    sidebar.classList.add('open');
    backdrop.classList.add('show');
  });
  backdrop.addEventListener('click', close);
}
