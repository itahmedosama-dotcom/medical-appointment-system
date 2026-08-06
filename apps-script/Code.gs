/**
 * Code.gs
 * نقطة الدخول الرئيسية للـ Web App + إعداد الأوراق (Sheets) لأول مرة.
 *
 * طريقة الاستخدام:
 * 1) شغّل الدالة setupSheets() مرة واحدة من محرر Apps Script (ستطلب صلاحيات، وافق عليها).
 * 2) انشر المشروع: Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 3) انسخ رابط الـ Web App وضعه في js/config.js داخل مشروع الواجهة (API_URL).
 * 4) غيّر قيمة API_KEY أدناه لمفتاح سري خاص بك، وضع نفس القيمة بالضبط في js/config.js (API_KEY).
 */

// مفتاح سري: كل طلب يوصل للـ API لازم يبعت نفس المفتاح، وإلا يترفض.
// غيّره لقيمة عشوائية طويلة خاصة بك، ولا تشاركه مع حد، وحدّث js/config.js بنفس القيمة.
const API_KEY = 'c744deaa54354f82c0d236c506b5411dae61695779c6b03d';

function doGet(e){
  return handleRequest(e);
}

function doPost(e){
  return handleRequest(e);
}

function handleRequest(e){
  try{
    var action, payload, apiKey;

    if(e.postData && e.postData.contents){
      var body = JSON.parse(e.postData.contents);
      action = body.action;
      payload = body.payload || {};
      apiKey = body.apiKey;
    } else {
      action = e.parameter.action;
      payload = e.parameter || {};
      apiKey = e.parameter.apiKey;
    }

    // تحقق من مفتاح API قبل أي شيء آخر — يرفض أي طلب بدون المفتاح الصحيح
    if(apiKey !== API_KEY){
      return jsonResponse({ success:false, error:'مفتاح API غير صحيح أو مفقود (apiKey)' });
    }

    if(!action) return jsonResponse({ success:false, error:'حقل action مطلوب' });

    var result;
    switch(action){
      // --- Auth ---
      case 'login': result = apiLogin(payload); break;
      case 'update_user_language': result = apiUpdateUserLanguage(payload); break;

      // --- Patients ---
      case 'patients_list':   result = apiPatientsList(); break;
      case 'patients_create': result = apiPatientsCreate(payload); break;
      case 'patients_update': result = apiPatientsUpdate(payload); break;
      case 'patients_delete': result = apiPatientsDelete(payload); break;

      // --- Providers ---
      case 'providers_list':   result = apiProvidersList(); break;
      case 'providers_create': result = apiProvidersCreate(payload); break;
      case 'providers_update': result = apiProvidersUpdate(payload); break;
      case 'providers_delete': result = apiProvidersDelete(payload); break;

      // --- Services ---
      case 'services_list':   result = apiServicesList(); break;
      case 'services_create': result = apiServicesCreate(payload); break;
      case 'services_update': result = apiServicesUpdate(payload); break;
      case 'services_delete': result = apiServicesDelete(payload); break;

      // --- Appointments ---
      case 'appointments_list':            result = apiAppointmentsList(payload); break;
      case 'appointments_check_conflict':  result = apiCheckConflict(payload); break;
      case 'appointments_create':          result = apiAppointmentsCreate(payload); break;
      case 'appointments_update_status':   result = apiAppointmentsUpdateStatus(payload); break;
      case 'appointments_delete':          result = apiAppointmentsDelete(payload); break;

      // --- Settings ---
      case 'settings_get':    result = apiSettingsGet(); break;
      case 'settings_update': result = apiSettingsUpdate(payload); break;

      // --- Reports ---
      case 'reports_summary': result = apiReportsSummary(payload); break;

      default:
        return jsonResponse({ success:false, error:'إجراء غير معروف: ' + action });
    }

    return jsonResponse({ success:true, data:result });

  } catch(err){
    return jsonResponse({ success:false, error: err.message });
  }
}

/**
 * ينشئ كل الأوراق المطلوبة بعناوين الأعمدة الصحيحة إن لم تكن موجودة،
 * ويزرع بيانات تجريبية (Sample Data) لو الأوراق فارغة، حتى تقدر تجرب النظام فورًا.
 * شغّلها مرة واحدة فقط من محرر Apps Script (اختر الدالة setupSheets ثم Run).
 */
function setupSheets(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var schema = {
    'Users':        ['ID','Username','Password','Role','Name','Language'],
    'Patients':     ['ID','Name','Phone','Age','Gender','Notes'],
    'Providers':    ['ID','Name','Type','Specialty','WorkDays','StartTime','EndTime','DefaultDuration','Active'],
    'Services':     ['ID','Name','NeedsDoctor','NeedsNurse','NeedsDevice','Duration'],
    'Appointments': ['ID','Date','Time','PatientID','ServiceID','DoctorID','NurseID','DeviceID','Duration','Status','Notes'],
    'Settings':     ['Key','Value']
  };

  Object.keys(schema).forEach(function(name){
    var sh = ss.getSheetByName(name);
    if(!sh) sh = ss.insertSheet(name);
    var headers = schema[name];
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.autoResizeColumns(1, headers.length);
  });

  // مهم جدًا: نمنع Google Sheets من تحويل أعمدة التاريخ/الوقت تلقائيًا لكائن Date حقيقي،
  // لأن هذا كان يكسر مطابقة التاريخ عند عرض حجوزات اليوم (الحجز يُنشأ بنجاح لكن لا يظهر).
  // بتثبيت التنسيق كـ "نص عادي" (@) قبل أي كتابة، تبقى القيم كما أرسلناها بالضبط.
  var apptSheet = ss.getSheetByName('Appointments');
  apptSheet.getRange('B2:C2000').setNumberFormat('@'); // Date, Time
  var providersSheet = ss.getSheetByName('Providers');
  providersSheet.getRange('F2:G2000').setNumberFormat('@'); // StartTime, EndTime

  // احذف الشيت الافتراضي "Sheet1" لو موجود وفاضي ومش من ضمن الأوراق المطلوبة
  var def = ss.getSheetByName('Sheet1');
  if(def && ss.getSheets().length > Object.keys(schema).length){
    ss.deleteSheet(def);
  }

  seedSampleDataIfEmpty();

  SpreadsheetApp.getUi().alert('تم إنشاء وتجهيز جميع الأوراق بنجاح ✅\n\nبيانات دخول تجريبية:\nUsername: admin\nPassword: admin123');
}

/** يزرع بيانات تجريبية فقط لو الورقة فاضية، حتى ما نكرّرش البيانات لو شغّلت الدالة أكتر من مرة */
function seedSampleDataIfEmpty(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var users = ss.getSheetByName('Users');
  if(users.getLastRow() < 2){
    users.appendRow([1, 'admin', 'admin123', 'مدير', 'أحمد حسين', 'ar']);
  }

  var settings = ss.getSheetByName('Settings');
  if(settings.getLastRow() < 2){
    settings.appendRow(['centerName', 'برنامج حجز عيادات']);
    settings.appendRow(['workStart', '09:00']);
    settings.appendRow(['workEnd', '20:00']);
    settings.appendRow(['countryCode', '20']);
    settings.appendRow(['whatsappTemplate',
      'مرحبًا {patient} 👋\nتم تأكيد حجزك في {center}:\n🩺 الخدمة: {service}\n📅 التاريخ: {date}\n⏰ الوقت: {time}\n👨\u200d⚕️ الطبيب: {doctor}\n👩\u200d⚕️ الممرضة: {nurse}\n🩻 الجهاز: {device}\nنرجو الحضور قبل الموعد بـ 10 دقائق.']);
  }

  var providers = ss.getSheetByName('Providers');
  if(providers.getLastRow() < 2){
    providers.appendRow([1, 'د. محمد سامي', 'doctor', 'باطنة', 'sat,sun,mon,tue,wed,thu', '09:00', '17:00', 20, true]);
    providers.appendRow([2, 'د. هبة فؤاد',  'doctor', 'جلدية', 'sun,mon,tue,wed,thu',     '10:00', '18:00', 25, true]);
    providers.appendRow([3, 'سارة يوسف',     'nurse',  'عناية عامة', 'sat,sun,mon,tue,wed,thu,fri', '09:00', '16:00', 15, true]);
    providers.appendRow([4, 'جهاز ليزر 1',   'device', 'ليزر تجميلي', 'sat,sun,mon,tue,wed,thu', '09:00', '20:00', 30, true]);
    providers.appendRow([5, 'جهاز أشعة 1',   'device', 'أشعة عادية',  'sat,sun,mon,tue,wed,thu', '08:00', '19:00', 15, false]);
  }

  var services = ss.getSheetByName('Services');
  if(services.getLastRow() < 2){
    services.appendRow([1, 'كشف عام',   true,  false, false, 20]);
    services.appendRow([2, 'جلسة ليزر', true,  true,  true,  30]);
    services.appendRow([3, 'أشعة',      false, false, true,  15]);
    services.appendRow([4, 'غيار جرح',  false, true,  false, 15]);
    services.appendRow([5, 'متابعة',    true,  false, false, 10]);
  }

  var patients = ss.getSheetByName('Patients');
  if(patients.getLastRow() < 2){
    patients.appendRow([1, 'أحمد علي',   '201012345678', 34, 'ذكر',  'حساسية من البنسلين']);
    patients.appendRow([2, 'محمد حسن',   '201123456789', 28, 'ذكر',  'متابعة جلسات ليزر']);
    patients.appendRow([3, 'منى إبراهيم', '201234567890', 41, 'أنثى', '']);
  }

  var appts = ss.getSheetByName('Appointments');
  if(appts.getLastRow() < 2){
    var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    appts.appendRow([1, today, '09:00', 1, 1, 1, '', '', 20, 'done', '']);
    appts.appendRow([2, today, '10:00', 2, 2, 2, 3, 4, 30, 'arrived', '']);
    appts.appendRow([3, today, '11:30', 3, 4, '', 3, '', 15, 'booked', '']);
  }
}
