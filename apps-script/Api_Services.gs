/** Api_Services.gs — CRUD كامل لورقة Services */

function apiServicesList(){
  return sheetToObjects('Services');
}

function apiServicesCreate(p){
  if(!p.name) throw new Error('اسم الخدمة مطلوب');
  var obj = {
    ID: nextId('Services'),
    Name: p.name,
    NeedsDoctor: p.needsDoctor === true || p.needsDoctor === 'true',
    NeedsNurse:  p.needsNurse  === true || p.needsNurse  === 'true',
    NeedsDevice: p.needsDevice === true || p.needsDevice === 'true',
    Duration: p.duration || 20
  };
  appendObject('Services', obj);
  return obj;
}

function apiServicesUpdate(p){
  if(!p.id) throw new Error('id مطلوب');
  var updates = {
    Name: p.name,
    NeedsDoctor: p.needsDoctor === true || p.needsDoctor === 'true',
    NeedsNurse:  p.needsNurse  === true || p.needsNurse  === 'true',
    NeedsDevice: p.needsDevice === true || p.needsDevice === 'true',
    Duration: p.duration
  };
  var ok = updateObjectById('Services', p.id, updates);
  if(!ok) throw new Error('الخدمة غير موجودة');
  return { ID: p.id };
}

function apiServicesDelete(p){
  if(!p.id) throw new Error('id مطلوب');
  var ok = deleteObjectById('Services', p.id);
  if(!ok) throw new Error('الخدمة غير موجودة');
  return { ID: p.id };
}
