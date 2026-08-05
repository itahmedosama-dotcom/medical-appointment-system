/**
 * lanes.js
 * منطق مشترك لعرض الحجوزات كـ "كلندر" مقسّم حسب مقدم الخدمة (جهاز / طبيب / ممرضة)
 * وتحت كل مقدم خدمة قائمة المرضى المحجوزين معه. يُستخدم في الرئيسية وشاشة الحجوزات اليومية
 * حتى تبقى نفس التجربة وأزرار الإجراء متطابقة في المكانين.
 */

/** أزرار إجراء تفاعلية بلمسة واحدة بدل قائمة منسدلة */
function statusActionsHtml(id, status){
  const btns = [];
  if(status !== 'arrived') btns.push(`<button class="status-chip-btn checkin" title="${t('actionCheckIn')}" onclick="updateStatus('${id}','arrived')"><i class="fa-solid fa-user-check"></i></button>`);
  if(status !== 'done') btns.push(`<button class="status-chip-btn complete" title="${t('actionComplete')}" onclick="updateStatus('${id}','done')"><i class="fa-solid fa-check-double"></i></button>`);
  if(status === 'cancelled'){
    btns.push(`<button class="status-chip-btn reopen" title="${t('actionReopen')}" onclick="updateStatus('${id}','booked')"><i class="fa-solid fa-rotate-left"></i></button>`);
  } else {
    btns.push(`<button class="status-chip-btn cancel" title="${t('actionCancel')}" onclick="confirmCancel('${id}')"><i class="fa-solid fa-xmark"></i></button>`);
  }
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
      ${g.rows.sort((a,b) => a.time.localeCompare(b.time)).map(r => `
        <div class="slot-row">
          <div class="slot-time">${r.time}</div>
          <div class="slot-info"><div class="p">${r.patientName}</div><div class="s">${r.serviceName}</div></div>
          ${statusActionsHtml(r.id, r.status)}
          <button class="btn btn-icon btn-soft btn-sm" data-action="share"
            data-patient="${r.patientName}" data-service="${r.serviceName}" data-date="${r.date}" data-time="${r.time}"
            data-provider="${r.providerName}" data-phone="${r.patientPhone||''}">
            <i class="fa-solid fa-share-nodes"></i>
          </button>
        </div>`).join('')}
    </div>`).join('');

  return `<div class="col-lg-4"><div class="lane-card ${type}">
    <div class="lane-head"><i class="fa-solid ${icon}"></i> ${t(titleKey)} <span class="chip ms-auto" style="background:rgba(255,255,255,.5);">${items.length}</span></div>
    ${groupsHtml}
  </div></div>`;
}

/**
 * يحوّل قائمة الحجوزات الخام (appointments) + المرضى/الخدمات/مقدمي الخدمة إلى HTML لثلاثة
 * ممرات بترتيب: جهاز، ثم طبيب، ثم ممرضة — وتحت كل مقدم خدمة مرضاه، ويطبّق فلتر بحث اختياري.
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
