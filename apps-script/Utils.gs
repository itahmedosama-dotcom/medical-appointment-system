/**
 * Utils.gs
 * دوال مساعدة عامة للتعامل مع Google Sheets كقاعدة بيانات بسيطة.
 */

function getSS(){
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet(name){
  var ss = getSS();
  var sh = ss.getSheetByName(name);
  if(!sh) throw new Error('لم يتم العثور على الورقة: ' + name + ' — شغّل setupSheets() أولاً.');
  return sh;
}

/** يحوّل صفوف الشيت إلى مصفوفة كائنات JSON حسب رؤوس الأعمدة */
function sheetToObjects(sheetName){
  var sh = getSheet(sheetName);
  var values = sh.getDataRange().getValues();
  if(values.length < 2) return [];
  var headers = values[0];
  var out = [];
  for(var i = 1; i < values.length; i++){
    var row = values[i];
    if(row.join('') === '') continue; // تجاهل الصفوف الفارغة
    var obj = {};
    for(var j = 0; j < headers.length; j++){
      obj[headers[j]] = row[j];
    }
    out.push(obj);
  }
  return out;
}

/** يضيف صفًا جديدًا حسب ترتيب رؤوس الأعمدة الفعلي في الشيت */
function appendObject(sheetName, obj){
  var sh = getSheet(sheetName);
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var row = headers.map(function(h){
    return obj[h] !== undefined && obj[h] !== null ? obj[h] : '';
  });
  sh.appendRow(row);
  return obj;
}

/** يحدّث صفًا موجودًا بمطابقة عمود ID */
function updateObjectById(sheetName, id, updates){
  var sh = getSheet(sheetName);
  var values = sh.getDataRange().getValues();
  var headers = values[0];
  var idCol = headers.indexOf('ID');
  if(idCol === -1) throw new Error('لا يوجد عمود ID في ' + sheetName);
  for(var i = 1; i < values.length; i++){
    if(String(values[i][idCol]) === String(id)){
      headers.forEach(function(h, j){
        if(updates[h] !== undefined){
          sh.getRange(i + 1, j + 1).setValue(updates[h]);
        }
      });
      return true;
    }
  }
  return false;
}

/** يحذف صفًا بمطابقة عمود ID */
function deleteObjectById(sheetName, id){
  var sh = getSheet(sheetName);
  var values = sh.getDataRange().getValues();
  var headers = values[0];
  var idCol = headers.indexOf('ID');
  if(idCol === -1) throw new Error('لا يوجد عمود ID في ' + sheetName);
  for(var i = 1; i < values.length; i++){
    if(String(values[i][idCol]) === String(id)){
      sh.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

/** يولّد رقم ID تسلسلي جديد (أكبر رقم حالي + 1) */
function nextId(sheetName){
  var sh = getSheet(sheetName);
  var lastRow = sh.getLastRow();
  if(lastRow < 2) return 1;
  var ids = sh.getRange(2, 1, lastRow - 1, 1).getValues()
    .map(function(r){ return Number(r[0]); })
    .filter(function(n){ return !isNaN(n); });
  if(ids.length === 0) return 1;
  return Math.max.apply(null, ids) + 1;
}

/** يحوّل "HH:MM" إلى عدد دقائق لتسهيل مقارنة الأوقات — يتعامل مع القيمة سواء نص أو كائن Date (لو Google Sheets حوّلها تلقائيًا) */
function timeToMinutes(t){
  var str = normalizeTimeStr(t);
  var parts = str.split(':');
  return (parseInt(parts[0], 10) * 60) + (parseInt(parts[1] || '0', 10));
}

/**
 * Google Sheets أحيانًا يحوّل نصوص التاريخ/الوقت المكتوبة تلقائيًا إلى كائن Date حقيقي
 * (حتى لو كُتبت من الكود كنص). الدالتان التاليتان تطبّعان القيمة لصيغة نصية ثابتة
 * بغض النظر عن كيفية تخزينها فعليًا في الخلية، لمنع مشاكل مطابقة التاريخ/الوقت.
 */
function normalizeDateStr(v){
  if(Object.prototype.toString.call(v) === '[object Date]'){
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(v);
}

function normalizeTimeStr(v){
  if(Object.prototype.toString.call(v) === '[object Date]'){
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'HH:mm');
  }
  return String(v);
}

/** رد JSON موحّد لكل الـ API */
function jsonResponse(obj){
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
