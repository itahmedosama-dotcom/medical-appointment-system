/**
 * export.js
 * أيقونة "مشاركة" واحدة بجانب كل حجز تفتح نافذة فيها 3 خيارات:
 * واتساب ويب / تحميل كصورة (PNG) / تحميل كـ PDF.
 * يتطلب: shareModal (بنية HTML موجودة في الصفحات التي تستخدمه) + html2canvas + jsPDF (CDN).
 */

let __settingsCache = null;

async function ensureSettingsCache(){
  if(__settingsCache) return __settingsCache;
  try{
    __settingsCache = await Api.getSettings();
  } catch(e){
    __settingsCache = {};
  }
  return __settingsCache;
}

function buildAppointmentMessage(data){
  const tpl = (__settingsCache && __settingsCache.whatsappTemplate) ||
    'مرحبًا {patient} 👋\nتم تأكيد حجزك في {center}:\n🩺 الخدمة: {service}\n📅 التاريخ: {date}\n⏰ الوقت: {time}\nنرجو الحضور قبل الموعد بـ 10 دقائق.';
  return tpl
    .replace(/{patient}/g, data.patient || '')
    .replace(/{center}/g, data.center || (Config && Config.CENTER_NAME) || '')
    .replace(/{service}/g, data.service || '')
    .replace(/{date}/g, data.date || '')
    .replace(/{time}/g, data.time || '');
}

function normalizePhone(phone){
  let digits = (phone || '').replace(/[^\d]/g, '');
  if(!digits) return '';
  // لو الرقم مكتوب بصيغة محلية (يبدأ بصفر)، استبدل الصفر بكود الدولة من الإعدادات
  if(digits.startsWith('0')){
    const cc = (__settingsCache && __settingsCache.countryCode) || '20';
    digits = cc + digits.slice(1);
  }
  return digits;
}

/** data = { patient, service, date, time, provider, phone, center } */
async function openShareModal(data){
  await ensureSettingsCache();
  data.center = data.center || __settingsCache.centerName || (Config && Config.CENTER_NAME);

  document.getElementById('shareCardPatient').textContent = data.patient || '-';
  document.getElementById('shareCardService').textContent = data.service || '-';
  document.getElementById('shareCardDate').textContent = data.date || '-';
  document.getElementById('shareCardTime').textContent = data.time || '-';
  document.getElementById('shareCardProvider').textContent = data.provider || '-';
  document.getElementById('shareCardCenter').textContent = data.center || '-';

  const waBtn = document.getElementById('shareWhatsappBtn');
  if(waBtn){
    waBtn.onclick = () => {
      const phone = normalizePhone(data.phone);
      if(!phone){
        alertToast(typeof t === 'function' ? t('noPhoneWarning') : 'لا يوجد رقم هاتف مسجل لهذا المريض', 'warning');
        return;
      }
      const text = encodeURIComponent(buildAppointmentMessage(data));
      const url = `https://wa.me/${phone}?text=${text}`;
      const win = window.open(url, '_blank', 'noopener');
      // بعض المتصفحات تمنع النوافذ المنبثقة — لو اتمنعت، اعرض رابط مباشر بدل ما نفشل بصمت
      if(!win || win.closed || typeof win.closed === 'undefined'){
        waBtn.outerHTML = `<a href="${url}" target="_blank" rel="noopener" class="share-option-btn whatsapp" style="text-decoration:none;"><i class="fa-brands fa-whatsapp"></i> ${typeof t === 'function' ? t('shareWhatsapp') : 'إرسال عبر واتساب ويب'}</a>`;
      }
    };
  }
  const pngBtn = document.getElementById('sharePngBtn');
  if(pngBtn) pngBtn.onclick = () => exportShareCard('png', data);

  const pdfBtn = document.getElementById('sharePdfBtn');
  if(pdfBtn) pdfBtn.onclick = () => exportShareCard('pdf', data);

  const modalEl = document.getElementById('shareModal');
  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

function exportShareCard(format, data){
  const card = document.getElementById('shareCardPrintable');
  if(typeof html2canvas === 'undefined'){
    alertToast('تعذّر تحميل مكتبة التصدير (html2canvas)', 'error');
    return;
  }
  html2canvas(card, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => {
    const safeName = (data.patient || 'booking').replace(/\s+/g, '-');
    if(format === 'png'){
      const link = document.createElement('a');
      link.download = `booking-${safeName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } else {
      if(typeof window.jspdf === 'undefined'){
        alertToast('تعذّر تحميل مكتبة jsPDF', 'error');
        return;
      }
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`booking-${safeName}.pdf`);
    }
  });
}

function alertToast(msg, icon){
  if(typeof Swal === 'undefined'){ alert(msg); return; }
  Swal.fire({ toast: true, position: 'top-start', icon: icon || 'info', title: msg, showConfirmButton: false, timer: 2200 });
}

/** يربط كل زر [data-action="share"] بفتح نافذة المشاركة بالبيانات الموجودة في data-* */
function initShareButtons(root){
  (root || document).querySelectorAll('[data-action="share"]').forEach(btn => {
    btn.addEventListener('click', () => {
      openShareModal({
        patient:  btn.getAttribute('data-patient'),
        service:  btn.getAttribute('data-service'),
        date:     btn.getAttribute('data-date'),
        time:     btn.getAttribute('data-time'),
        provider: btn.getAttribute('data-provider'),
        phone:    btn.getAttribute('data-phone')
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => initShareButtons());
