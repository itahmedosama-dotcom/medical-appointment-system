/** Api_Settings.gs — إعدادات المركز كمفتاح/قيمة (Key/Value) */

function apiSettingsGet(){
  var rows = sheetToObjects('Settings');
  var obj = {};
  rows.forEach(function(r){ obj[r.Key] = r.Value; });
  return obj;
}

function apiSettingsUpdate(p){
  Object.keys(p).forEach(function(key){
    if(key === 'action') return;
    var updated = updateSettingKey(key, p[key]);
    if(!updated){
      appendObject('Settings', { Key: key, Value: p[key] });
    }
  });
  return apiSettingsGet();
}

function updateSettingKey(key, value){
  var sh = getSheet('Settings');
  var values = sh.getDataRange().getValues();
  for(var i = 1; i < values.length; i++){
    if(String(values[i][0]) === String(key)){
      sh.getRange(i + 1, 2).setValue(value);
      return true;
    }
  }
  return false;
}
