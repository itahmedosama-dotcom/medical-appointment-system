/** Api_Patients.gs — CRUD كامل لورقة Patients */

function apiPatientsList(){
  return sheetToObjects('Patients');
}

function apiPatientsCreate(p){
  if(!p.name || !p.phone) throw new Error('اسم المريض والهاتف مطلوبان');
  var obj = {
    ID: nextId('Patients'),
    Name: p.name,
    Phone: p.phone,
    Age: p.age || '',
    Gender: p.gender || 'ذكر',
    Notes: p.notes || ''
  };
  appendObject('Patients', obj);
  return obj;
}

function apiPatientsUpdate(p){
  if(!p.id) throw new Error('id مطلوب');
  var updates = { Name: p.name, Phone: p.phone, Age: p.age, Gender: p.gender, Notes: p.notes };
  var ok = updateObjectById('Patients', p.id, updates);
  if(!ok) throw new Error('المريض غير موجود');
  return { ID: p.id };
}

function apiPatientsDelete(p){
  if(!p.id) throw new Error('id مطلوب');
  var ok = deleteObjectById('Patients', p.id);
  if(!ok) throw new Error('المريض غير موجود');
  return { ID: p.id };
}
