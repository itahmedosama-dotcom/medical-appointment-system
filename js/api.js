/**
 * api.js
 * طبقة اتصال موحدة بين الواجهة وGoogle Apps Script.
 * قراءة (list/get) عبر GET، وكتابة (create/update/delete) عبر POST
 * بـ Content-Type: text/plain لتفادي مشاكل CORS preflight مع Apps Script.
 */

const Api = (function(){

  function isConfigured(){
    return Config.API_URL && Config.API_URL.indexOf('PASTE_YOUR') === -1
        && Config.API_KEY && Config.API_KEY.indexOf('PASTE_YOUR') === -1;
  }

  function flatten(obj){
    const out = {};
    Object.keys(obj || {}).forEach(k => {
      out[k] = (obj[k] === undefined || obj[k] === null) ? '' : obj[k];
    });
    return out;
  }

  function handle(res){
    return res.json().then(json => {
      if(!json.success) throw new Error(json.error || 'حدث خطأ غير متوقع من الخادم');
      return json.data;
    });
  }

  function call(action, payload, method){
    method = method || 'GET';
    if(!isConfigured()){
      return Promise.reject(new Error('لم يتم ضبط رابط الـ API أو مفتاحه بعد. راجع SETUP_GUIDE.md وضبط js/config.js'));
    }
    if(method === 'GET'){
      const qs = new URLSearchParams(Object.assign({ action, apiKey: Config.API_KEY }, flatten(payload))).toString();
      return fetch(`${Config.API_URL}?${qs}`).then(handle);
    }
    return fetch(Config.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, apiKey: Config.API_KEY, payload: payload || {} })
    }).then(handle);
  }

  return {
    isConfigured,

    // Auth
    login: (username, password) => call('login', { username, password }, 'POST'),
    updateUserLanguage: (id, language) => call('update_user_language', { id, language }, 'POST'),

    // Users & Permissions
    getUsers:    () => call('users_list'),
    createUser:  (data) => call('users_create', data, 'POST'),
    updateUser:  (id, data) => call('users_update', Object.assign({ id }, data), 'POST'),
    deleteUser:  (id, requesterId) => call('users_delete', { id, requesterId }, 'POST'),

    // Patients
    getPatients:    () => call('patients_list'),
    createPatient:  (data) => call('patients_create', data, 'POST'),
    updatePatient:  (id, data) => call('patients_update', Object.assign({ id }, data), 'POST'),
    deletePatient:  (id) => call('patients_delete', { id }, 'POST'),

    // Providers
    getProviders:   () => call('providers_list'),
    createProvider: (data) => call('providers_create', data, 'POST'),
    updateProvider: (id, data) => call('providers_update', Object.assign({ id }, data), 'POST'),
    deleteProvider: (id) => call('providers_delete', { id }, 'POST'),

    // Services
    getServices:    () => call('services_list'),
    createService:  (data) => call('services_create', data, 'POST'),
    updateService:  (id, data) => call('services_update', Object.assign({ id }, data), 'POST'),
    deleteService:  (id) => call('services_delete', { id }, 'POST'),

    // Appointments
    getAppointments:        (date) => call('appointments_list', { date }),
    checkConflict:           (data) => call('appointments_check_conflict', data),
    createAppointment:       (data) => call('appointments_create', data, 'POST'),
    updateAppointmentStatus: (id, status, requesterId, requesterName) => call('appointments_update_status', { id, status, requesterId, requesterName }, 'POST'),
    deleteAppointment:       (id) => call('appointments_delete', { id }, 'POST'),

    // Activity log
    getActivityLog: (limit) => call('activity_list', { limit }),

    // Settings
    getSettings:    () => call('settings_get'),
    updateSettings: (data) => call('settings_update', data, 'POST'),

    // Reports
    getReportsSummary: (period) => call('reports_summary', { period })
  };
})();
