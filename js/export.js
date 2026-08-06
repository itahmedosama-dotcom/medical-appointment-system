/**
 * export.js
 * أيقونة "مشاركة" واحدة بجانب كل حجز تفتح نافذة فيها 3 خيارات:
 * واتساب ويب / تحميل كصورة (PNG) / تحميل كـ PDF.
 * يتطلب: shareModal (بنية HTML موجودة في الصفحات التي تستخدمه) + html2canvas + jsPDF (CDN).
 */

let __settingsCache = null;

/** يعرض رقم الحجز بصيغة موحّدة في كل مكان بالنظام (بطاقة المشاركة، تفاصيل الحجز، الكلندر، رسالة واتساب...) */
function formatBookingRef(id){
  return '#' + String(id).padStart(5, '0');
}

async function ensureSettingsCache(){
  if(__settingsCache) return __settingsCache;
  try{
    __settingsCache = await Api.getSettings();
  } catch(e){
    __settingsCache = {};
  }
  return __settingsCache;
}

const DEFAULT_WHATSAPP_TEMPLATE =
  'مرحبًا {patient} 👋\nتم تأكيد حجزك في {center}:\n🔢 رقم الحجز: {bookingId}\n🩺 الخدمة: {service}\n📅 التاريخ: {date}\n⏰ الوقت: {time}\n👨\u200d⚕️ الطبيب: {doctor}\n👩\u200d⚕️ الممرضة: {nurse}\n🩻 الجهاز: {device}\nنرجو الحضور قبل الموعد بـ 10 دقائق.';

function buildAppointmentMessage(data){
  const tpl = (__settingsCache && __settingsCache.whatsappTemplate) || DEFAULT_WHATSAPP_TEMPLATE;
  const vars = {
    patient:   data.patient || '',
    center:    data.center || (Config && Config.CENTER_NAME) || '',
    service:   data.service || '',
    date:      data.date || '',
    time:      data.time || '',
    doctor:    data.doctor || '',
    nurse:     data.nurse || '',
    device:    data.device || '',
    bookingId: data.bookingId ? formatBookingRef(data.bookingId) : ''
  };
  // مقدمو الخدمة (طبيب/ممرضة/جهاز) اختياريون حسب الخدمة — لو مفيش قيمة للمتغير، نحذف السطر بالكامل
  // بدل ما يظهر السطر فاضي (مثلاً "الجهاز: " من غير اسم) في الرسالة المُرسلة فعليًا.
  const optionalKeys = ['doctor', 'nurse', 'device', 'bookingId'];
  const lines = tpl.split('\n').filter(line =>
    !optionalKeys.some(k => line.includes('{' + k + '}') && !vars[k])
  );
  let msg = lines.join('\n');
  Object.keys(vars).forEach(k => {
    msg = msg.split('{' + k + '}').join(vars[k]);
  });
  return msg;
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

/** يبني رابط واتساب جاهز لبيانات حجز معيّنة، أو null لو مفيش رقم هاتف صالح */
function buildWhatsAppUrl(data){
  const phone = normalizePhone(data.phone);
  if(!phone) return null;
  const text = encodeURIComponent(buildAppointmentMessage(data));
  return `https://wa.me/${phone}?text=${text}`;
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
  const refEl = document.getElementById('shareCardRef');
  if(refEl) refEl.textContent = data.bookingId ? formatBookingRef(data.bookingId) : '-';
  const logoEl = document.getElementById('shareCardLogo');
  if(logoEl){
    if(__settingsCache && __settingsCache.centerLogo){
      logoEl.src = __settingsCache.centerLogo;
      logoEl.style.display = 'block';
    } else {
      logoEl.style.display = 'none';
    }
  }

  const waBtn = document.getElementById('shareWhatsappBtn');
  if(waBtn){
    const phone = normalizePhone(data.phone);
    if(!phone){
      waBtn.href = '#';
      waBtn.onclick = (e) => {
        e.preventDefault();
        alertToast(typeof t === 'function' ? t('noPhoneWarning') : 'لا يوجد رقم هاتف مسجل لهذا المريض', 'warning');
      };
    } else {
      const text = encodeURIComponent(buildAppointmentMessage(data));
      // رابط <a> حقيقي بدل window.open — الطريقة الموثوقة اللي متتأثرش بمنع النوافذ المنبثقة في المتصفحات
      waBtn.href = `https://wa.me/${phone}?text=${text}`;
      waBtn.onclick = null;
    }
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
  exportCardCanvas(card, format, data);
}

/**
 * نسخة مستقلة تمامًا عن أي Modal: بتبني بطاقة مؤقتة بره حدود الشاشة (نفس تصميم بطاقة
 * المشاركة)، تصدّرها كصورة/PDF، وتشيلها فورًا. تُستخدم من نافذة "تفاصيل الحجز" في التقويم
 * عشان نتفادى مشكلة تعارض فتح Modal فوق Modal تاني بيتقفل.
 */
async function exportBookingCardStandalone(format, data){
  await ensureSettingsCache();
  const center = data.center || __settingsCache.centerName || (Config && Config.CENTER_NAME) || '';
  const logo = __settingsCache.centerLogo
    ? `<img src="${__settingsCache.centerLogo}" style="width:34px;height:34px;border-radius:8px;object-fit:cover;flex-shrink:0;">`
    : '';
  const tt = (k, fallback) => (typeof t === 'function' ? t(k) : fallback);

  const temp = document.createElement('div');
  temp.style.position = 'fixed';
  temp.style.insetInlineStart = '-9999px';
  temp.style.top = '0';
  temp.innerHTML = `
    <div class="printable-card" id="__standaloneExportCard">
      <div class="pc-head" style="display:flex;align-items:center;gap:.6rem;">
        ${logo}
        <div><span>${center}</span><small>${tt('shareCardSubtitle','تأكيد حجز موعد')}</small></div>
      </div>
      <div class="pc-body">
        <div class="pc-row"><span>${tt('shareBookingRef','رقم الحجز')}</span><span>${data.bookingId ? formatBookingRef(data.bookingId) : '-'}</span></div>
        <div class="pc-row"><span>${tt('shareClient','العميل')}</span><span>${data.patient || '-'}</span></div>
        <div class="pc-row"><span>${tt('shareService','الخدمة')}</span><span>${data.service || '-'}</span></div>
        <div class="pc-row"><span>${tt('shareDate','التاريخ')}</span><span>${data.date || '-'}</span></div>
        <div class="pc-row"><span>${tt('shareTime','الوقت')}</span><span>${data.time || '-'}</span></div>
        <div class="pc-row"><span>${tt('shareProvider','مقدم الخدمة')}</span><span>${data.provider || '-'}</span></div>
      </div>
    </div>`;
  document.body.appendChild(temp);

  try{
    await exportCardCanvas(temp.querySelector('#__standaloneExportCard'), format, data);
  } finally {
    document.body.removeChild(temp);
  }
}

function exportCardCanvas(card, format, data){
  if(typeof html2canvas === 'undefined'){
    alertToast('تعذّر تحميل مكتبة التصدير (html2canvas)', 'error');
    return Promise.resolve();
  }
  return html2canvas(card, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => {
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
        patient:   btn.getAttribute('data-patient'),
        service:   btn.getAttribute('data-service'),
        date:      btn.getAttribute('data-date'),
        time:      btn.getAttribute('data-time'),
        provider:  btn.getAttribute('data-provider'),
        doctor:    btn.getAttribute('data-doctor') || '',
        nurse:     btn.getAttribute('data-nurse') || '',
        device:    btn.getAttribute('data-device') || '',
        bookingId: btn.getAttribute('data-booking-id') || '',
        phone:     btn.getAttribute('data-phone')
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => initShareButtons());
