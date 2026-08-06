/**
 * lanes.js
 * منطق مشترك لعرض الحجوزات كـ "كلندر" مقسّم حسب مقدم الخدمة (جهاز / طبيب / ممرضة)
 * وتحت كل مقدم خدمة قائمة المرضى المحجوزين معه. يُستخدم في الرئيسية وشاشة الحجوزات اليومية
 * حتى تبقى نفس التجربة وأزرار الإجراء متطابقة في المكانين.
 */

/**
 * أزرار إجراء تفاعلية بلمسة واحدة — لكن مقيّدة بترتيب المراحل الثابت:
 * محجوز ← حضر ← انتهى (مينفعش نقفز مرحلة). الإلغاء متاح من محجوز/حضر فقط،
 * والاسترجاع متاح من ملغي فقط (وبيتفحص تعارض على السيرفر وقت الاسترجاع).
 */
function statusActionsHtml(id, status){
  const btns = [];
  if(status === 'booked'){
    btns.push(`<button class="status-chip-btn checkin" title="${t('actionCheckIn')}" onclick="updateStatus('${id}','arrived')"><i class="fa-solid fa-user-check"></i></button>`);
    btns.push(`<button class="status-chip-btn cancel" title="${t('actionCancel')}" onclick="confirmCancel('${id}')"><i class="fa-solid fa-xmark"></i></button>`);
  } else if(status === 'arrived'){
    btns.push(`<button class="status-chip-btn complete" title="${t('actionComplete')}" onclick="updateStatus('${id}','done')"><i class="fa-solid fa-check-double"></i></button>`);
    btns.push(`<button class="status-chip-btn cancel" title="${t('actionCancel')}" onclick="confirmCancel('${id}')"><i class="fa-solid fa-xmark"></i></button>`);
  } else if(status === 'cancelled'){
    btns.push(`<button class="status-chip-btn reopen" title="${t('actionReopen')}" onclick="updateStatus('${id}','booked')"><i class="fa-solid fa-rotate-left"></i></button>`);
  }
  // "انتهى" حالة نهائية — بدون أزرار إضافية
  return `
    <div class="status-actions">
      <span class="status-chip-btn current ${status}">${t('status'+status.charAt(0).toUpperCase()+status.slice(1))}</span>
      ${btns.join('')}
    </div>`;
}

/** يبني عمود ممر واحد (جهاز/طبيب/ممرضة) مقسّم حسب مقدم الخدمة، وتحت كل واحد قائمة مرضاه */
function buildLaneCard(type, icon, titleKey, items){
  if(items.length === 0){
    return `<div class="col-lg-4"><div class="lane-card ${type}">
      <div class="lane-head"><i class="fa-solid ${icon}"></i> ${t(titleKey)} <span class="chip ms-auto" style="background:rgba(255,255,255,.5);">0</span></div>
      <div class="text-center faint py-4" style="font-size:.85rem;">${t('noAppointmentsLane')}</div>
    </div></div>`;
  }

  const byProvider = {};
  items.forEach(row => {
    const key = row.providerId || 'x';
    if(!byProvider[key]) byProvider[key] = { name: row.providerName, rows: [] };
    byProvider[key].rows.push(row);
  });

  const groupsHtml = Object.values(byProvider).map(g => `
    <div class="lane-provider-group">
      <div class="lane-provider-name">${g.name}</div>
      ${g.rows.sort((a,b) => a.time.localeCompare(b.time)).map(r => {
        const combinedProviders = [r.doctor && r.doctor.providerName, r.nurse && r.nurse.providerName, r.device && r.device.providerName]
          .filter(Boolean).join('، ');
        return `
        <div class="slot-row">
          <div class="slot-time">${r.time}</div>
          <div class="slot-info"><div class="p">${r.patientName}</div><div class="s">${r.serviceName}</div></div>
          ${statusActionsHtml(r.id, r.status)}
          <button class="btn btn-icon btn-soft btn-sm" data-action="share"
            data-patient="${r.patientName}" data-service="${r.serviceName}" data-date="${r.date}" data-time="${r.time}"
            data-provider="${combinedProviders}"
            data-doctor="${r.doctor ? r.doctor.providerName : ''}"
            data-nurse="${r.nurse ? r.nurse.providerName : ''}"
            data-device="${r.device ? r.device.providerName : ''}"
            data-booking-id="${r.id}"
            data-phone="${r.patientPhone||''}">
            <i class="fa-solid fa-share-nodes"></i>
          </button>
        </div>`;
      }).join('')}
    </div>`).join('');

  return `<div class="col-lg-4"><div class="lane-card ${type}">
    <div class="lane-head"><i class="fa-solid ${icon}"></i> ${t(titleKey)} <span class="chip ms-auto" style="background:rgba(255,255,255,.5);">${items.length}</span></div>
    ${groupsHtml}
  </div></div>`;
}


/* ============================================================
   عرض التقويم الزمني (Timeline) — عمود لكل مقدم خدمة، والحجوزات
   متوضعة فعليًا حسب وقتها بدل قائمة مجمّعة، شبيه بجداول العيادات الاحترافية.
   ============================================================ */

const CAL_HOUR_HEIGHT = 64; // px لكل ساعة

function calTimeToMinutes(str){
  const parts = String(str || '0:0').split(':');
  return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
}

/** يحسب نطاق الساعات المعروض (من - إلى) بناءً على أوقات العمل والحجوزات الفعلية، بحد أدنى معقول */
function calComputeRange(settings, appointments){
  let startH = settings && settings.workStart ? calTimeToMinutes(settings.workStart) / 60 : 8;
  let endH   = settings && settings.workEnd   ? calTimeToMinutes(settings.workEnd)   / 60 : 20;
  appointments.forEach(a => {
    const h = calTimeToMinutes(a.Time) / 60;
    if(h < startH) startH = h;
    if(h + 1 > endH) endH = h + 1;
  });
  startH = Math.max(0, Math.floor(startH) - 1);
  endH = Math.min(24, Math.ceil(endH) + 1);
  if(endH - startH < 6) endH = Math.min(24, startH + 6);
  return { startH, endH };
}

function calLaneOfType(type){
  return type === 'doctor' ? 'doctor' : (type === 'nurse' ? 'nurse' : 'device');
}

/**
 * يبني شبكة تقويم كاملة (محور الوقت + عمود لكل مقدم خدمة فعّال) داخل hostId.
 * appointments: نتيجة Api.getAppointments (خام من السيرفر).
 * الترتيب: أجهزة، ثم أطباء، ثم ممرضات — كل واحد عمود مستقل.
 */
function renderCalendarGrid(hostId, appointments, patients, services, providers, settings, searchQuery){
  const host = document.getElementById(hostId);
  if(!host) return;

  const activeProviders = providers.filter(p => p.Active === true || String(p.Active).toLowerCase() === 'true');
  const ordered = [
    ...activeProviders.filter(p => p.Type === 'device'),
    ...activeProviders.filter(p => p.Type === 'doctor'),
    ...activeProviders.filter(p => p.Type === 'nurse')
  ];

  if(ordered.length === 0){
    host.innerHTML = `<div class="cal-empty-col py-5">${t('noProvidersFound')}</div>`;
    return;
  }

  const { startH, endH } = calComputeRange(settings, appointments);
  const totalHeight = (endH - startH) * CAL_HOUR_HEIGHT;
  const patientById = Object.fromEntries(patients.map(p => [String(p.ID), p]));
  const serviceById = Object.fromEntries(services.map(s => [String(s.ID), s]));

  const q = (searchQuery || '').trim();

  // ساعات محور الوقت
  let hoursHtml = '';
  for(let h = startH; h < endH; h++){
    const label = String(h).padStart(2,'0') + ':00';
    hoursHtml += `<div class="cal-hour-label">${label}</div>`;
  }

  const colsHtml = ordered.map(prov => {
    const laneType = calLaneOfType(prov.Type);
    const idField = prov.Type === 'doctor' ? 'DoctorID' : (prov.Type === 'nurse' ? 'NurseID' : 'DeviceID');
    // الحجوزات الملغاة تختفي من الكلندر — تُعرض فقط من نافذة "الملغاة" المخصّصة (قابلة للاسترجاع من هناك)
    let items = appointments.filter(a => String(a[idField]) === String(prov.ID) && a.Status !== 'cancelled');
    if(q){
      items = items.filter(a => {
        const patient = patientById[String(a.PatientID)];
        return patient && patient.Name && patient.Name.includes(q);
      });
    }

    const blocksHtml = items.map(a => {
      const patient = patientById[String(a.PatientID)];
      const service = serviceById[String(a.ServiceID)];
      const startMin = calTimeToMinutes(a.Time);
      const duration = Number(a.Duration || 20);
      const top = Math.max(0, (startMin - startH * 60) / 60 * CAL_HOUR_HEIGHT);
      const height = Math.max(26, duration / 60 * CAL_HOUR_HEIGHT - 3);
      const endMin = startMin + duration;
      const timeLabel = `${a.Time}–${String(Math.floor(endMin/60)).padStart(2,'0')}:${String(endMin%60).padStart(2,'0')}`;
      const pname = patient ? patient.Name : ('#' + a.PatientID);
      const sname = service ? service.Name : ('#' + a.ServiceID);
      return `<div class="cal-block ${a.Status}" style="top:${top}px;height:${height}px;" onclick='openApptDetail(${JSON.stringify(a)})'>
        <div class="cal-b-time">${timeLabel} <span class="cal-b-ref">${formatBookingRef(a.ID)}</span></div>
        <div class="cal-b-patient">${pname}</div>
        <div class="cal-b-service">${sname}</div>
      </div>`;
    }).join('');

    const initials = (prov.Name || '?').trim().slice(0,2);
    const colorVar = laneType === 'doctor' ? 'teal-dark' : (laneType === 'nurse' ? 'violet' : 'amber');
    const tintClass = laneType === 'doctor' ? 'bg-teal-tint' : (laneType === 'nurse' ? 'bg-violet-tint' : 'bg-amber-tint');
    return `<div class="cal-col">
      <div class="cal-col-header">
        <div class="cal-avatar ${tintClass}" style="color:var(--${colorVar});">${initials}</div>
        <div class="cal-name" title="${prov.Name}">${prov.Name}</div>
      </div>
      <div class="cal-col-body" style="height:${totalHeight}px;">${blocksHtml}</div>
    </div>`;
  }).join('');

  // خط الوقت الحالي (لو ضمن النطاق المعروض)
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  let nowLineHtml = '';
  if(nowMin >= startH * 60 && nowMin <= endH * 60){
    const top = (nowMin - startH * 60) / 60 * CAL_HOUR_HEIGHT;
    const hh = String(now.getHours()).padStart(2,'0');
    const mm = String(now.getMinutes()).padStart(2,'0');
    nowLineHtml = `<div class="cal-now-line" style="top:${top}px;"><span class="cal-now-badge">${hh}:${mm}</span></div>`;
  }

  host.innerHTML = `
    <div class="cal-container">
      <div class="cal-inner">
        <div class="cal-time-col">
          <div class="cal-corner"></div>
          ${hoursHtml}
        </div>
        ${colsHtml}
        ${nowLineHtml}
      </div>
    </div>`;
}

/** يفتح نافذة تفاصيل حجز واحد فيها زر مشاركة + أزرار تغيير الحالة، تُستدعى بالضغط على أي بلوك في التقويم */
function openApptDetail(appt){
  window.__currentApptDetail = appt;
  const patient = (window.__calPatients || []).find(p => String(p.ID) === String(appt.PatientID));
  const service = (window.__calServices || []).find(s => String(s.ID) === String(appt.ServiceID));
  const providers = window.__calProviders || [];
  const doctorName = appt.DoctorID ? ((providers.find(p => String(p.ID) === String(appt.DoctorID)) || {}).Name || '') : '';
  const nurseName  = appt.NurseID  ? ((providers.find(p => String(p.ID) === String(appt.NurseID)))  || {}).Name  || '' : '';
  const deviceName = appt.DeviceID ? ((providers.find(p => String(p.ID) === String(appt.DeviceID)) || {}).Name || '') : '';

  document.getElementById('apptDetailPatient').textContent = patient ? patient.Name : ('#' + appt.PatientID);
  document.getElementById('apptDetailService').textContent = service ? service.Name : ('#' + appt.ServiceID);
  document.getElementById('apptDetailDateTime').textContent = `${appt.Date} — ${appt.Time}`;
  const refEl = document.getElementById('apptDetailRef');
  if(refEl) refEl.textContent = formatBookingRef(appt.ID);
  const providerNames = [doctorName, nurseName, deviceName].filter(Boolean).join('، ');
  document.getElementById('apptDetailProviders').textContent = providerNames || '-';
  document.getElementById('apptDetailActions').innerHTML = statusActionsHtml(appt.ID, appt.Status);

  const shareBtn = document.getElementById('apptDetailShareBtn');
  shareBtn.onclick = () => {
    bootstrap.Modal.getInstance(document.getElementById('apptDetailModal'))?.hide();
    openShareModal({
      patient: patient ? patient.Name : '-',
      service: service ? service.Name : '-',
      date: appt.Date, time: appt.Time,
      provider: providerNames || '-',
      doctor: doctorName || '', nurse: nurseName || '', device: deviceName || '',
      bookingId: appt.ID,
      phone: patient ? patient.Phone : ''
    });
  };

  bootstrap.Modal.getOrCreateInstance(document.getElementById('apptDetailModal')).show();
}

/**
 * يحوّل قائمة الحجوزات الخام (appointments) + المرضى/الخدمات/مقدمي الخدمة إلى HTML لثلاثة
 * ممرات بترتيب: جهاز، ثم طبيب، ثم ممرضة — وتحت كل مقدم خدمة مرضاه، ويطبّق فلتر بحث اختياري.
 * (هذا العرض البديل "قائمة" لمن يفضّل القائمة المجمّعة بدل شبكة التقويم الزمني).
 */
function renderLanesInto(hostId, appointments, patients, services, providers, searchQuery){
  const q = (searchQuery || '').trim();
  const patientById = Object.fromEntries(patients.map(p => [String(p.ID), p]));
  const serviceById = Object.fromEntries(services.map(s => [String(s.ID), s]));
  const providerById = Object.fromEntries(providers.map(p => [String(p.ID), p]));

  let rows = appointments.map(a => {
    const patient = patientById[String(a.PatientID)];
    const service = serviceById[String(a.ServiceID)];
    return {
      id: a.ID, date: a.Date, time: a.Time, status: a.Status,
      patientName: patient ? patient.Name : ('#' + a.PatientID),
      patientPhone: patient ? patient.Phone : '',
      serviceName: service ? service.Name : ('#' + a.ServiceID),
      doctor: a.DoctorID ? { providerId:a.DoctorID, providerName:(providerById[String(a.DoctorID)]||{}).Name || '#'+a.DoctorID } : null,
      nurse:  a.NurseID  ? { providerId:a.NurseID,  providerName:(providerById[String(a.NurseID)]||{}).Name  || '#'+a.NurseID }  : null,
      device: a.DeviceID ? { providerId:a.DeviceID, providerName:(providerById[String(a.DeviceID)]||{}).Name || '#'+a.DeviceID } : null
    };
  });

  if(q){
    rows = rows.filter(r =>
      r.patientName.includes(q) ||
      (r.doctor && r.doctor.providerName.includes(q)) ||
      (r.nurse && r.nurse.providerName.includes(q)) ||
      (r.device && r.device.providerName.includes(q)));
  }

  const doctorItems = rows.filter(r => r.doctor).map(r => ({ ...r, providerId:r.doctor.providerId, providerName:r.doctor.providerName }));
  const nurseItems  = rows.filter(r => r.nurse).map(r => ({ ...r, providerId:r.nurse.providerId, providerName:r.nurse.providerName }));
  const deviceItems = rows.filter(r => r.device).map(r => ({ ...r, providerId:r.device.providerId, providerName:r.device.providerName }));

  // الترتيب المطلوب: جهاز، ثم طبيب، ثم ممرضة
  const host = document.getElementById(hostId);
  if(!host) return;
  host.innerHTML =
    buildLaneCard('device', 'fa-radiation',   'laneDevices', deviceItems) +
    buildLaneCard('doctor', 'fa-user-doctor', 'laneDoctors', doctorItems) +
    buildLaneCard('nurse',  'fa-user-nurse',  'laneNurses',  nurseItems);

  initShareButtons(host);
}
