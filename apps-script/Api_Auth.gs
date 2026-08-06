/**
 * Api_Auth.gs
 * تسجيل الدخول — مقارنة بسيطة بورقة Users.
 * ملاحظة: هذا تخزين كلمة مرور نصي بسيط مناسب لمشروع صغير/تجريبي.
 * لمشروع إنتاجي حقيقي يفضّل استخدام تجزئة (hash) لكلمة المرور.
 */
function apiLogin(p){
  if(!p.username || !p.password){
    throw new Error('اسم المستخدم وكلمة المرور مطلوبان');
  }
  var users = sheetToObjects('Users');
  var u = users.find(function(x){
    return String(x.Username) === String(p.username) && String(x.Password) === String(p.password);
  });
  if(!u) throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
  return { id: u.ID, username: u.Username, role: u.Role, name: u.Name, language: u.Language || 'ar' };
}

/** يحفظ لغة الواجهة المفضّلة لهذا المستخدم في ورقة Users حتى تُحمّل تلقائيًا عند تسجيل الدخول من أي جهاز */
function apiUpdateUserLanguage(p){
  if(!p.id || !p.language) throw new Error('id و language مطلوبان');
  var ok = updateObjectById('Users', p.id, { Language: p.language });
  if(!ok) throw new Error('المستخدم غير موجود');
  return { ID: p.id, Language: p.language };
}
