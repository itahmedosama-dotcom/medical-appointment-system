/* ============================================================
   app.js — سلوك واجهة عام مشترك بين كل الصفحات.
   منطق البيانات الفعلي (CRUD) موجود داخل كل صفحة + api.js،
   وهذا الملف مسؤول فقط عن سلوك واجهة عام (القائمة الجانبية على الموبايل).
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initSidebarToggle();
  applyCenterLogo();
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

/**
 * لو المركز رفع شعار من الإعدادات، نستبدل به حرف العلامة الافتراضي (.mark) في كل مكان —
 * القائمة الجانبية وصفحة الدخول. بيتخزّن في الكاش المحلي (localStorage) بعد أول تحميل
 * عشان يظهر فورًا في الصفحات التالية بدون انتظار الشبكة، وبيتحدّث في الخلفية لو اتغيّر.
 */
async function applyCenterLogo(){
  const marks = document.querySelectorAll('.mark');
  if(marks.length === 0) return;

  const cached = localStorage.getItem('mas_logo');
  if(cached) renderLogoIntoMarks(marks, cached);

  if(typeof Api === 'undefined' || !Api.isConfigured()) return;
  try{
    const settings = await Api.getSettings();
    const logo = settings.centerLogo || '';
    if(logo && logo !== cached){
      localStorage.setItem('mas_logo', logo);
      renderLogoIntoMarks(document.querySelectorAll('.mark'), logo);
    } else if(!logo && cached){
      localStorage.removeItem('mas_logo');
      // رجّع العلامة الافتراضية (الحرف) لو تمت إزالة الشعار من الإعدادات
      document.querySelectorAll('.mark img[data-center-logo]').forEach(img => {
        img.closest('.mark').textContent = img.closest('.mark').getAttribute('data-fallback-letter') || 'ح';
      });
    }
  } catch(e){ /* تجاهل أي خطأ شبكة هنا، مش حرج لعرض الواجهة */ }
}

function renderLogoIntoMarks(marks, logoDataUrl){
  marks.forEach(mark => {
    if(mark.querySelector('img[data-center-logo]')) return; // متطبق بالفعل
    if(!mark.getAttribute('data-fallback-letter')){
      mark.setAttribute('data-fallback-letter', mark.textContent.trim());
    }
    mark.innerHTML = `<img data-center-logo src="${logoDataUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`;
  });
}
