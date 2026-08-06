/**
 * Api_Appointments.gs
 * الحجوزات + منطق منع تضارب المواعيد الفعلي.
 * القاعدة: أي مقدم خدمة (طبيب/ممرضة/جهاز) لا يمكن حجزه في نفس الوقت لأكثر من عميل.
 * المقارنة تتم بتقاطع الفترات الزمنية (Start/End) وليس فقط تطابق وقت البداية.
 *
 * ملاحظة مهمة: كل قراءة لورقة Appointments تمر عبر getAppointmentsNormalized()
 * التي تطبّع عمودي Date/Time لصيغة نصية ثابتة (yyyy-MM-dd و HH:mm)، لأن Google Sheets
 * أحيانًا يحوّل هذه الأعمدة تلقائيًا لكائن Date حقيقي حتى لو كُتبت كنص، مما كان يمنع
 * ظهور الحجز في شاشة اليوم بسبب فشل مطابقة نص التاريخ. setupSheets() أيضًا تضبط تنسيق
 * هذين العمودين كنص صريح لمنع هذا التحويل التلقائي من الأساس.
 */

function getAppointmentsNormalized(){
  return sheetToObjects('Appointments').map(function(a){
    a.Date = normalizeDateStr(a.Date);
    a.Time = normalizeTimeStr(a.Time);
    return a;
  });
}

function apiAppointmentsList(p){
  var all = getAppointmentsNormalized();
  if(p && p.date){
    all = all.filter(function(a){ return a.Date === normalizeDateStr(p.date); });
  }
  return all;
}

/**
 * يبحث عن أي حجوزات متعارضة مع providerId في date عند time لمدة duration دقيقة.
 * يتجاهل الحجوزات الملغاة (cancelled) ويمكن استثناء حجز معيّن (عند التعديل) عبر excludeAppointmentId.
 */
function findConflicts(providerId, date, time, duration, excludeAppointmentId){
  if(!providerId) return [];
  var newStart = timeToMinutes(time);
  var newEnd = newStart + Number(duration || 20);
  var targetDate = normalizeDateStr(date);

  var all = getAppointmentsNormalized();
  var conflicts = [];

  all.forEach(function(a){
    if(excludeAppointmentId && String(a.ID) === String(excludeAppointmentId)) return;
    if(a.Status === 'cancelled') return;
    if(a.Date !== targetDate) return;

    var involvesProvider = [a.DoctorID, a.NurseID, a.DeviceID].some(function(id){
      return id !== '' && id !== null && id !== undefined && String(id) === String(providerId);
    });
    if(!involvesProvider) return;

    var existingStart = timeToMinutes(a.Time);
    var existingEnd = existingStart + Number(a.Duration || 20);

    // تقاطع فترتين زمنيتين: تعارض لو بدأ الجديد قبل ما ينتهي القديم، وبدأ القديم قبل ما ينتهي الجديد
    if(newStart < existingEnd && existingStart < newEnd){
      conflicts.push(a);
    }
  });

  return conflicts;
}

/** يفحص التعارض لكل مقدمي الخدمة المرسلين (طبيب/ممرضة/جهاز) دفعة واحدة */
function apiCheckConflict(p){
  var allConflicts = [];
  ['doctorId', 'nurseId', 'deviceId'].forEach(function(key){
    if(p[key]){
      var c = findConflicts(p[key], p.date, p.time, p.duration, p.excludeId);
      allConflicts = allConflicts.concat(c);
    }
  });
  return { hasConflict: allConflicts.length > 0, conflicts: allConflicts };
}

function apiAppointmentsCreate(p){
  if(!p.date || !p.time || !p.patientId || !p.serviceId){
    throw new Error('التاريخ والوقت والعميل والخدمة كلها مطلوبة');
  }

  // فحص التعارض على السيرفر هو الفحص الحاسم (authoritative) — حتى لو تم تجاوز فحص الواجهة
  var conflictResult = apiCheckConflict(p);
  if(conflictResult.hasConflict){
    var c = conflictResult.conflicts[0];
    throw new Error('يوجد تعارض في الموعد: مقدم الخدمة محجوز بالفعل في هذا الوقت (حجز رقم ' + c.ID + ' الساعة ' + c.Time + ')');
  }

  var obj = {
    ID: nextId('Appointments'),
    Date: p.date,
    Time: p.time,
    PatientID: p.patientId,
    ServiceID: p.serviceId,
    DoctorID: p.doctorId || '',
    NurseID: p.nurseId || '',
    DeviceID: p.deviceId || '',
    Duration: p.duration || 20,
    Status: 'booked',
    Notes: p.notes || ''
  };
  appendObject('Appointments', obj);
  return obj;
}

function apiAppointmentsUpdateStatus(p){
  if(!p.id || !p.status) throw new Error('id و status مطلوبان');
  var valid = ['booked', 'arrived', 'done', 'cancelled'];
  if(valid.indexOf(p.status) === -1) throw new Error('حالة غير صحيحة');
  var ok = updateObjectById('Appointments', p.id, { Status: p.status });
  if(!ok) throw new Error('الحجز غير موجود');
  return { ID: p.id, Status: p.status };
}

function apiAppointmentsDelete(p){
  if(!p.id) throw new Error('id مطلوب');
  var ok = deleteObjectById('Appointments', p.id);
  if(!ok) throw new Error('الحجز غير موجود');
  return { ID: p.id };
}
