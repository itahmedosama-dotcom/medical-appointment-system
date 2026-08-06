/** Api_Providers.gs — CRUD كامل لورقة Providers (أطباء / ممرضات / أجهزة) */

function apiProvidersList(){
  return sheetToObjects('Providers');
}

function apiProvidersCreate(p){
  if(!p.name || !p.type) throw new Error('الاسم والنوع مطلوبان');
  var obj = {
    ID: nextId('Providers'),
    Name: p.name,
    Type: p.type, // doctor | nurse | device
    Specialty: p.specialty || '',
    WorkDays: p.workDays || '',
    StartTime: p.startTime || '09:00',
    EndTime: p.endTime || '17:00',
    DefaultDuration: p.defaultDuration || 20,
    Active: p.active === false || p.active === 'false' ? false : true
  };
  appendObject('Providers', obj);
  return obj;
}

function apiProvidersUpdate(p){
  if(!p.id) throw new Error('id مطلوب');
  var updates = {
    Name: p.name, Type: p.type, Specialty: p.specialty, WorkDays: p.workDays,
    StartTime: p.startTime, EndTime: p.endTime, DefaultDuration: p.defaultDuration,
    Active: (p.active === false || p.active === 'false') ? false : true
  };
  var ok = updateObjectById('Providers', p.id, updates);
  if(!ok) throw new Error('مقدم الخدمة غير موجود');
  return { ID: p.id };
}

function apiProvidersDelete(p){
  if(!p.id) throw new Error('id مطلوب');
  var ok = deleteObjectById('Providers', p.id);
  if(!ok) throw new Error('مقدم الخدمة غير موجود');
  return { ID: p.id };
}
