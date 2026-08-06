/** Api_Reports.gs — ملخصات وتقارير (اليوم / الشهر) */

function apiReportsSummary(p){
  var period = (p && p.period) || 'today';
  var appts = getAppointmentsNormalized();
  var patients = sheetToObjects('Patients');
  var providers = sheetToObjects('Providers');
  var services = sheetToObjects('Services');

  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var monthPrefix = today.substring(0, 7);

  var filtered = period === 'month'
    ? appts.filter(function(a){ return String(a.Date).indexOf(monthPrefix) === 0; })
    : appts.filter(function(a){ return String(a.Date) === today; });

  var byStatus = { booked: 0, arrived: 0, done: 0, cancelled: 0 };
  filtered.forEach(function(a){
    if(byStatus[a.Status] !== undefined) byStatus[a.Status]++;
  });

  var byServiceCount = {};
  filtered.forEach(function(a){
    byServiceCount[a.ServiceID] = (byServiceCount[a.ServiceID] || 0) + 1;
  });
  var servicesRanking = Object.keys(byServiceCount).map(function(id){
    var svc = services.find(function(s){ return String(s.ID) === String(id); });
    return { id: id, name: svc ? svc.Name : ('#' + id), count: byServiceCount[id] };
  }).sort(function(a, b){ return b.count - a.count; });

  var byProviderCount = {};
  filtered.forEach(function(a){
    [a.DoctorID, a.NurseID, a.DeviceID].forEach(function(pid){
      if(pid) byProviderCount[pid] = (byProviderCount[pid] || 0) + 1;
    });
  });
  var providersRanking = Object.keys(byProviderCount).map(function(id){
    var pr = providers.find(function(x){ return String(x.ID) === String(id); });
    return { id: id, name: pr ? pr.Name : ('#' + id), type: pr ? pr.Type : '', count: byProviderCount[id] };
  }).sort(function(a, b){ return b.count - a.count; });

  return {
    period: period,
    totalAppointments: filtered.length,
    totalPatients: patients.length,
    totalProviders: providers.length,
    byStatus: byStatus,
    servicesRanking: servicesRanking,
    providersRanking: providersRanking
  };
}
