/**
 * i18n.js
 * نظام ترجمة كامل عربي/إنجليزي.
 * - يقرأ اللغة المفضّلة: أولوية لغة الحساب المحفوظة في Google Sheets (بعد تسجيل الدخول)،
 *   ثم آخر لغة محفوظة محليًا (localStorage)، ثم العربية كافتراضي.
 * - يبدّل اتجاه الصفحة (rtl/ltr) وملف Bootstrap المناسب من داخل <head> (انظر السكربت أعلى كل صفحة).
 * - applyTranslations() تملأ كل عنصر عليه data-i18n / data-i18n-placeholder / data-i18n-title.
 */

const DICT = {
  // ------- عام / Common -------
  appName:        { ar:'برنامج حجز عيادات', en:'Clinics Booking Program' },
  save:           { ar:'حفظ', en:'Save' },
  cancel:         { ar:'إلغاء', en:'Cancel' },
  edit:           { ar:'تعديل', en:'Edit' },
  delete:         { ar:'حذف', en:'Delete' },
  add:            { ar:'إضافة', en:'Add' },
  close:          { ar:'إغلاق', en:'Close' },
  loading:        { ar:'جارِ التحميل...', en:'Loading...' },
  search:         { ar:'بحث', en:'Search' },
  confirmDeleteTitle: { ar:'تأكيد الحذف', en:'Confirm deletion' },
  confirmDeleteText:  { ar:'هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذا الإجراء.', en:'Are you sure you want to delete this? This cannot be undone.' },
  deletedToast:   { ar:'تم الحذف', en:'Deleted' },
  savedToast:     { ar:'تم الحفظ', en:'Saved' },
  errorTitle:     { ar:'حدث خطأ', en:'Something went wrong' },
  apiNotConfigured: { ar:'الواجهة غير متصلة بقاعدة البيانات بعد. راجع SETUP_GUIDE.md.', en:'The interface is not connected to the database yet. See SETUP_GUIDE.md.' },
  trialBadge:     { ar:'نظام متصل ببيانات حقيقية', en:'Connected to live data' },
  logout:         { ar:'تسجيل الخروج', en:'Log out' },
  notifications:  { ar:'الإشعارات', en:'Notifications' },

  // ------- القائمة الجانبية / Sidebar -------
  navHome:        { ar:'الرئيسية', en:'Home' },
  navAppointments: { ar:'المواعيد', en:'Appointments' },
  navPatients:    { ar:'المرضى', en:'Patients' },
  navProviders:   { ar:'مقدمو الخدمة', en:'Providers' },
  navServices:    { ar:'الخدمات', en:'Services' },
  navAppointmentsSection: { ar:'المواعيد', en:'Appointments' },
  navBooking:     { ar:'الحجز', en:'Booking' },
  navDaily:       { ar:'الحجوزات اليومية', en:'Daily Schedule' },
  navSystemSection: { ar:'النظام', en:'System' },
  navReports:     { ar:'التقارير', en:'Reports' },
  navSettings:    { ar:'الإعدادات', en:'Settings' },
  navPermissions: { ar:'الصلاحيات', en:'Permissions' },
  sidebarSubtitle: { ar:'نظام إدارة المواعيد', en:'Appointment Management System' },
  noPermissionTitle: { ar:'ليس لديك صلاحية', en:'Access denied' },
  noPermissionText: { ar:'ليس لديك صلاحية الوصول لهذه الصفحة. تواصل مع مدير النظام لتفعيلها.', en:'You do not have permission to access this page. Contact your administrator.' },

  // ------- تسجيل الدخول / Login -------
  loginEyebrow:   { ar:'تسجيل الدخول', en:'Sign in' },
  loginTitle:     { ar:'أهلًا بعودتك', en:'Welcome back' },
  loginSubtitle:  { ar:'سجّل الدخول لمتابعة حجوزات اليوم وإدارة المركز.', en:"Sign in to manage today's bookings and the center." },
  username:       { ar:'اسم المستخدم', en:'Username' },
  password:       { ar:'كلمة المرور', en:'Password' },
  rememberMe:     { ar:'تذكرني', en:'Remember me' },
  loginBtn:       { ar:'تسجيل الدخول', en:'Sign in' },
  loggingIn:      { ar:'... جاري الدخول', en:'Signing in...' },
  demoCreds:      { ar:'بيانات تجريبية بعد تشغيل setupSheets(): admin / admin123', en:'Demo credentials after running setupSheets(): admin / admin123' },
  captchaLabel:   { ar:'رمز التحقق', en:'Verification code' },
  captchaPlaceholder: { ar:'اكتب رمز التحقق', en:'Type the verification code' },
  captchaRefresh: { ar:'تحديث الرمز', en:'Refresh code' },
  captchaCopy:    { ar:'نسخ الرمز', en:'Copy code' },
  captchaCopied:  { ar:'تم نسخ الرمز', en:'Code copied' },
  captchaMismatch: { ar:'رمز التحقق غير صحيح، حاول مرة أخرى', en:'Incorrect verification code, please try again' },
  captchaRequired: { ar:'أدخل رمز التحقق أولًا', en:'Enter the verification code first' },
  heroTitle:      { ar:'جدول يومك الطبي، منظم حسب كل طبيب وممرضة وجهاز.', en:'Your daily medical schedule, organized by every doctor, nurse, and device.' },
  heroSubtitle:   { ar:'لا مزيد من التعارض بين المواعيد — كل مقدم خدمة له خط زمني خاص به يمنع الحجز المزدوج تلقائيًا (يتم التحقق فعليًا من الخادم).', en:'No more scheduling conflicts — every provider has their own timeline that prevents double-booking automatically (verified server-side).' },
  doctorsLabel:   { ar:'أطباء', en:'Doctors' },
  nursesLabel:    { ar:'ممرضات', en:'Nurses' },
  devicesLabel:   { ar:'أجهزة', en:'Devices' },

  // ------- الرئيسية / Dashboard -------
  dashTitle:      { ar:'نظرة عامة على اليوم', en:"Today's overview" },
  dashSubtitle:   { ar:'ملخص الحجوزات والنشاط في برنامج حجز عيادات.', en:'A summary of bookings and activity at the center.' },
  newBooking:     { ar:'حجز جديد', en:'New booking' },
  kpiApptsToday:  { ar:'حجوزات اليوم', en:"Today's bookings" },
  kpiPatientsTotal: { ar:'إجمالي المرضى', en:'Total patients' },
  kpiProvidersTotal: { ar:'مقدمو الخدمة', en:'Providers' },
  kpiDone:        { ar:'حجوزات منتهية', en:'Completed' },
  kpiCancelled:   { ar:'حجوزات ملغاة', en:'Cancelled' },
  recentBookings: { ar:'آخر الحجوزات اليوم', en:"Today's recent bookings" },
  viewAll:        { ar:'عرض الكل', en:'View all' },
  laneDistribution: { ar:'توزيع اليوم حسب النوع', en:"Today's distribution by type" },
  topServices:    { ar:'أكثر الخدمات طلبًا', en:'Most requested services' },
  noBookingsToday: { ar:'لا توجد حجوزات اليوم', en:'No bookings today' },
  noDataYet:      { ar:'لا يوجد بعد', en:'Not available yet' },
  calendarEyebrow: { ar:'كلندر الحجوزات', en:'Booking calendar' },
  calendarTitle:  { ar:'جدول المواعيد', en:'Appointment schedule' },
  calendarSubtitle: { ar:'كل المواعيد مرتبة حسب الأجهزة ثم الأطباء ثم الممرضات، وتحت كل واحد مرضاه.', en:'All appointments grouped by devices, then doctors, then nurses — with their patients listed underneath.' },

  // ------- المرضى / Patients -------
  patientsEyebrow: { ar:'إدارة المرضى', en:'Patient management' },
  patientsTitle:  { ar:'المرضى', en:'Patients' },
  patientsCountSuffix: { ar:'مريض مسجل', en:'registered patients' },
  addPatient:     { ar:'إضافة مريض', en:'Add patient' },
  colPatient:     { ar:'المريض', en:'Patient' },
  colPhone:       { ar:'الهاتف', en:'Phone' },
  colAge:         { ar:'العمر', en:'Age' },
  colGender:      { ar:'الجنس', en:'Gender' },
  colNotes:       { ar:'ملاحظات', en:'Notes' },
  addPatientTitle: { ar:'إضافة مريض', en:'Add patient' },
  editPatientTitle: { ar:'تعديل بيانات المريض', en:"Edit patient's info" },
  name:           { ar:'الاسم', en:'Name' },
  age:            { ar:'العمر', en:'Age' },
  gender:         { ar:'الجنس', en:'Gender' },
  male:           { ar:'ذكر', en:'Male' },
  female:         { ar:'أنثى', en:'Female' },
  notes:          { ar:'ملاحظات', en:'Notes' },
  notesPlaceholder: { ar:'حساسية، ملاحظات طبية...', en:'Allergies, medical notes...' },
  noPatientsFound: { ar:'لا يوجد مرضى مطابقون', en:'No matching patients' },
  nameRequired:   { ar:'الاسم والهاتف مطلوبان', en:'Name and phone are required' },

  // ------- مقدمو الخدمة / Providers -------
  providersEyebrow: { ar:'إدارة الفريق والأجهزة', en:'Team & equipment management' },
  providersTitle: { ar:'مقدمو الخدمة', en:'Providers' },
  providersSubtitle: { ar:'أطباء، ممرضات، وأجهزة — كل نوع له لون ثابت في كل الشاشات.', en:'Doctors, nurses, and devices — each type keeps a fixed color across the app.' },
  addProvider:    { ar:'إضافة مقدم خدمة', en:'Add provider' },
  filterAll:      { ar:'الكل', en:'All' },
  filterDoctors:  { ar:'أطباء', en:'Doctors' },
  filterNurses:   { ar:'ممرضات', en:'Nurses' },
  filterDevices:  { ar:'أجهزة', en:'Devices' },
  colType:        { ar:'النوع', en:'Type' },
  colSpecialty:   { ar:'التخصص', en:'Specialty' },
  colWorkHours:   { ar:'وقت العمل', en:'Working hours' },
  colDuration:    { ar:'مدة الموعد', en:'Slot duration' },
  colStatus:      { ar:'الحالة', en:'Status' },
  active:         { ar:'فعال', en:'Active' },
  inactive:       { ar:'غير فعال', en:'Inactive' },
  addProviderTitle: { ar:'إضافة مقدم خدمة', en:'Add provider' },
  editProviderTitle: { ar:'تعديل بيانات مقدم الخدمة', en:"Edit provider's info" },
  typeLabel:      { ar:'النوع', en:'Type' },
  doctor:         { ar:'طبيب', en:'Doctor' },
  nurse:          { ar:'ممرضة', en:'Nurse' },
  device:         { ar:'جهاز', en:'Device' },
  specialty:      { ar:'التخصص', en:'Specialty' },
  specialtyPlaceholder: { ar:'مثال: جلدية، أشعة...', en:'e.g. Dermatology, Radiology...' },
  startTime:      { ar:'وقت البداية', en:'Start time' },
  endTime:        { ar:'وقت النهاية', en:'End time' },
  defaultDuration: { ar:'مدة الموعد الافتراضية (دقيقة)', en:'Default slot duration (minutes)' },
  providerActiveLabel: { ar:'فعال', en:'Active' },
  providerNameRequired: { ar:'اسم مقدم الخدمة مطلوب', en:"Provider's name is required" },
  noProvidersFound: { ar:'لا يوجد مقدمو خدمة مطابقون', en:'No matching providers' },

  // ------- الخدمات / Services -------
  servicesEyebrow: { ar:'قائمة الخدمات', en:'Service list' },
  servicesTitle:  { ar:'الخدمات', en:'Services' },
  servicesSubtitle: { ar:'حدّد احتياج كل خدمة، ويظهر النظام حقول الحجز المطلوبة تلقائيًا.', en:'Set what each service needs — the booking form adapts automatically.' },
  addService:     { ar:'إضافة خدمة', en:'Add service' },
  minutesSuffix:  { ar:'د', en:'min' },
  needsLabel:     { ar:'الاحتياجات', en:'Requirements' },
  needDoctor:     { ar:'تحتاج طبيب', en:'Needs a doctor' },
  needNurse:      { ar:'تحتاج ممرضة', en:'Needs a nurse' },
  needDevice:     { ar:'تحتاج جهاز', en:'Needs a device' },
  noNeedsSet:     { ar:'لا يوجد احتياج محدد', en:'No requirements set' },
  addServiceTitle: { ar:'إضافة خدمة', en:'Add service' },
  editServiceTitle: { ar:'تعديل الخدمة', en:'Edit service' },
  serviceName:    { ar:'اسم الخدمة', en:'Service name' },
  serviceNamePlaceholder: { ar:'مثال: جلسة ليزر', en:'e.g. Laser session' },
  serviceDuration: { ar:'مدة الخدمة (دقيقة)', en:'Service duration (minutes)' },
  serviceNameRequired: { ar:'اسم الخدمة مطلوب', en:"Service name is required" },
  noServicesFound: { ar:'لا توجد خدمات بعد', en:'No services yet' },

  // ------- الحجز / Booking -------
  bookingEyebrow: { ar:'حجز جديد', en:'New booking' },
  bookingTitle:   { ar:'الحجز', en:'Booking' },
  bookingSubtitle: { ar:'اختر الخدمة أولًا — يعرض النظام تلقائيًا الحقول المطلوبة فقط، ويتحقق من التعارض فعليًا مع الخادم.', en:'Pick a service first — the form shows only what it needs, and checks conflicts live with the server.' },
  bookingDataTitle: { ar:'بيانات الحجز', en:'Booking details' },
  patientLabel:   { ar:'العميل', en:'Client' },
  choosePatient:  { ar:'اختر المريض...', en:'Choose patient...' },
  serviceLabel:   { ar:'الخدمة', en:'Service' },
  chooseService:  { ar:'اختر الخدمة...', en:'Choose service...' },
  dateLabel:      { ar:'التاريخ', en:'Date' },
  timeLabel:      { ar:'الوقت', en:'Time' },
  dynamicFieldsHint: { ar:'الحقول التالية تظهر حسب الخدمة المختارة', en:'The fields below appear based on the selected service' },
  doctorLabel:    { ar:'الطبيب', en:'Doctor' },
  nurseLabel:     { ar:'الممرضة', en:'Nurse' },
  deviceLabel:    { ar:'الجهاز', en:'Device' },
  chooseOption:   { ar:'اختر...', en:'Choose...' },
  confirmBookingBtn: { ar:'تأكيد الحجز', en:'Confirm booking' },
  shareBtn:       { ar:'مشاركة', en:'Share' },
  shareDisabledTitle: { ar:'أكّد الحجز أولًا', en:'Confirm the booking first' },
  previewTitle:   { ar:'معاينة بطاقة الحجز', en:'Booking card preview' },
  previewLabel:   { ar:'معاينة', en:'Preview' },
  previewProvidersLabel: { ar:'مقدمو الخدمة', en:'Providers' },
  shareHintBooking: { ar:'بعد تأكيد الحجز يمكنك الضغط على "مشاركة" لإرساله عبر واتساب أو تحميله كصورة/PDF.', en:'After confirming, tap "Share" to send it via WhatsApp or download it as an image/PDF.' },
  bookingSuccess: { ar:'تم تأكيد الحجز', en:'Booking confirmed' },
  bookingFillFirst: { ar:'أكمل بيانات الحجز أولًا', en:'Please complete the booking details first' },
  conflictYes:    { ar:'يوجد تعارض: مقدم الخدمة محجوز بالفعل في هذا الوقت.', en:'Conflict: this provider is already booked at that time.' },
  conflictNo:     { ar:'لا يوجد تعارض في المواعيد لمقدمي الخدمة المختارين.', en:'No scheduling conflicts for the selected providers.' },
  conflictCheckFailed: { ar:'تعذّر التحقق من التعارض', en:'Could not check for conflicts' },
  pastDateError:  { ar:'لا يمكن الحجز في يوم سابق — اختر اليوم الحالي أو تاريخًا لاحقًا', en:"You can't book a past date — choose today or a future date" },
  pastTimeError:  { ar:'لا يمكن الحجز في وقت سابق للوقت الحالي', en:"You can't book a time earlier than now" },

  // ------- الحجوزات اليومية / Daily appointments -------
  dailyEyebrow:   { ar:'اليوم', en:'Today' },
  dailyTitle:     { ar:'الحجوزات اليومية', en:'Daily schedule' },
  dailySubtitle:  { ar:'العرض حسب مقدم الخدمة — كل عمود يمثل خطًا زمنيًا مستقلًا يمنع تضارب المواعيد فعليًا.', en:'Grouped by provider — each column is an independent timeline that actually prevents conflicts.' },
  viewCalendar:   { ar:'تقويم', en:'Calendar' },
  viewList:       { ar:'قائمة', en:'List' },
  laneDoctors:    { ar:'الأطباء', en:'Doctors' },
  laneNurses:     { ar:'الممرضات', en:'Nurses' },
  laneDevices:    { ar:'الأجهزة', en:'Devices' },
  noAppointmentsLane: { ar:'لا توجد مواعيد', en:'No appointments' },
  shareHintDaily: { ar:'أيقونة المشاركة بجانب كل حجز تفتح نافذة لإرساله عبر واتساب أو تحميله كصورة/PDF.', en:'The share icon next to each booking opens a window to send it via WhatsApp or download it.' },
  actionCheckIn:  { ar:'تسجيل حضور', en:'Check in' },
  actionComplete: { ar:'إنهاء', en:'Complete' },
  actionCancel:   { ar:'إلغاء', en:'Cancel' },
  actionReopen:   { ar:'إرجاع لمحجوز', en:'Reopen as booked' },
  statusUpdated:  { ar:'تم تحديث الحالة', en:'Status updated' },
  apptDetailsTitle: { ar:'تفاصيل الحجز', en:'Booking details' },
  clickBlockHint: { ar:'اضغط على أي حجز في الجدول لعرض التفاصيل وتغيير الحالة', en:'Click any booking on the schedule to view details or change its status' },
  cancelApptTitle: { ar:'إلغاء الحجز', en:'Cancel booking' },
  cancelApptText: { ar:'هل تريد إلغاء هذا الحجز؟', en:'Do you want to cancel this booking?' },
  cancelApptConfirm: { ar:'نعم، إلغاء', en:'Yes, cancel' },
  keepBooking:    { ar:'تراجع', en:'Keep it' },
  cancelledBtn:   { ar:'الملغاة', en:'Cancelled' },
  cancelledModalTitle: { ar:'الحجوزات الملغاة', en:'Cancelled bookings' },
  cancelledModalHint: { ar:'حجوزات هذا اليوم اللي اتلغت. تقدر ترجّعها لو حصل غلط، وهيتفحص تعارض تاني وقت الاسترجاع.', en:"Cancelled bookings for this day. You can restore them if it was a mistake — a fresh conflict check runs on restore." },
  noCancelledFound: { ar:'لا توجد حجوزات ملغاة في هذا اليوم', en:'No cancelled bookings for this day' },

  // ------- التقارير / Reports -------
  reportsEyebrow: { ar:'تحليلات المركز', en:'Center analytics' },
  reportsTitle:   { ar:'التقارير', en:'Reports' },
  reportsSubtitle: { ar:'ملخص الأداء اليومي والشهري.', en:'Daily and monthly performance summary.' },
  periodToday:    { ar:'اليوم', en:'Today' },
  periodMonth:    { ar:'الشهر', en:'Month' },
  kpiApptsTodayLabel: { ar:'حجوزات اليوم', en:"Today's bookings" },
  kpiApptsMonthLabel: { ar:'حجوزات الشهر', en:"This month's bookings" },
  providerPerformance: { ar:'أداء مقدمي الخدمة', en:'Provider performance' },
  colBookings:    { ar:'حجوزات', en:'Bookings' },
  statusDistribution: { ar:'توزيع الحالات', en:'Status distribution' },

  // ------- الإعدادات / Settings -------
  settingsEyebrow: { ar:'إعدادات النظام', en:'System settings' },
  settingsTitle:  { ar:'الإعدادات', en:'Settings' },
  settingsSubtitle: { ar:'بيانات المركز وأوقات العمل ونص رسالة واتساب — مخزّنة فعليًا في ورقة Settings.', en:"Center info, working hours, and the WhatsApp message — stored in the Settings sheet." },
  centerInfoTitle: { ar:'بيانات المركز', en:'Center information' },
  centerName:     { ar:'اسم المركز', en:'Center name' },
  countryCodeLabel: { ar:'كود الدولة (للواتساب)', en:'Country code (for WhatsApp)' },
  whatsappTemplateTitle: { ar:'رسالة تأكيد واتساب الافتراضية', en:'Default WhatsApp confirmation message' },
  whatsappVarsHint: { ar:'المتغيرات المتاحة: {patient} {center} {bookingId} {service} {date} {time} {doctor} {nurse} {device} — تُستبدل تلقائيًا، وأي سطر فيه متغير طبيب/ممرضة/جهاز بدون قيمة (خدمة مش محتاجاه) بيتحذف تلقائيًا من الرسالة.', en:'Available variables: {patient} {center} {bookingId} {service} {date} {time} {doctor} {nurse} {device} — filled automatically. Any line with an empty doctor/nurse/device variable is removed automatically from the message.' },
  resetTemplateBtn: { ar:'استعادة القالب الافتراضي', en:'Reset to default template' },
  saveSettingsBtn: { ar:'حفظ الإعدادات', en:'Save settings' },
  savedSettingsToast: { ar:'تم حفظ الإعدادات', en:'Settings saved' },
  usersNoteTitle: { ar:'ملاحظة', en:'Note' },
  usersNoteBody:  { ar:'كلمات المرور وأسماء الدخول تُدار من هنا، والصلاحيات التفصيلية لكل مستخدم من صفحة "الصلاحيات".', en:'Usernames and passwords are managed here; detailed per-user permissions are on the "Permissions" page.' },

  // ------- الصلاحيات / Permissions -------
  permissionsEyebrow: { ar:'إدارة المستخدمين', en:'User management' },
  permissionsTitle: { ar:'الصلاحيات', en:'Permissions' },
  permissionsSubtitle: { ar:'حدّد لكل مستخدم أي أجزاء من النظام يقدر يوصلها ويعدّل فيها.', en:'Control which parts of the system each user can access and edit.' },
  addUser:        { ar:'إضافة مستخدم', en:'Add user' },
  colUsername:    { ar:'اسم الدخول', en:'Username' },
  colRole:        { ar:'الدور', en:'Role' },
  addUserTitle:   { ar:'إضافة مستخدم', en:'Add user' },
  editUserTitle:  { ar:'تعديل المستخدم', en:'Edit user' },
  roleLabel:      { ar:'الدور الوظيفي', en:'Job role' },
  rolePlaceholder: { ar:'مثال: موظف استقبال', en:'e.g. Receptionist' },
  passwordOptionalHint: { ar:'اتركه فارغًا للإبقاء على كلمة المرور الحالية', en:'Leave empty to keep the current password' },
  permissionsListLabel: { ar:'الصلاحيات', en:'Permissions' },
  permPatients:   { ar:'المرضى', en:'Patients' },
  permProviders:  { ar:'مقدمو الخدمة', en:'Providers' },
  permServices:   { ar:'الخدمات', en:'Services' },
  permAppointments: { ar:'المواعيد', en:'Appointments' },
  permReports:    { ar:'التقارير', en:'Reports' },
  permSettings:   { ar:'الإعدادات', en:'Settings' },
  permPermissions: { ar:'الصلاحيات (إدارة المستخدمين)', en:'Permissions (user management)' },
  userFieldsRequired: { ar:'اسم المستخدم وكلمة المرور والاسم مطلوبون', en:'Username, password, and name are required' },
  cannotDeleteSelf: { ar:'لا يمكنك حذف حسابك الخاص وأنت مسجّل دخول به', en:"You can't delete your own account while signed in with it" },
  noUsersFound:   { ar:'لا يوجد مستخدمون', en:'No users found' },
  fullAccessBadge: { ar:'كل الصلاحيات', en:'Full access' },
  noAccessBadge:  { ar:'لا صلاحيات', en:'No access' },

  // ------- سجل الحركات / Activity log -------
  activityLogEyebrow: { ar:'سجل النظام', en:'System log' },
  activityLogTitle: { ar:'سجل الحركات', en:'Activity log' },
  activityLogSubtitle: { ar:'كل عملية حجز، تسجيل حضور، إنهاء، إلغاء، أو استرجاع — بالوقت والتاريخ واسم من قام بها.', en:'Every booking, check-in, completion, cancellation, or restore — with the time, date, and who did it.' },
  colDateTime:    { ar:'التاريخ والوقت', en:'Date & time' },
  colUser:        { ar:'المستخدم', en:'User' },
  colAction:      { ar:'الحركة', en:'Action' },
  colDetails:     { ar:'التفاصيل', en:'Details' },
  actionCreate:   { ar:'حجز جديد', en:'New booking' },
  actionDelete:   { ar:'حذف', en:'Deleted' },
  noLogFound:     { ar:'لا توجد حركات مسجّلة بعد', en:'No activity recorded yet' },
  languageSectionTitle: { ar:'اللغة', en:'Language' },
  languageSectionBody: { ar:'لغة الواجهة المفضّلة لحسابك. تُحفظ مع حسابك وتُطبَّق تلقائيًا عند تسجيل الدخول من أي جهاز.', en:'Your preferred interface language. Saved to your account and applied automatically wherever you sign in.' },

  // ------- نافذة المشاركة / Share modal -------
  shareModalTitle: { ar:'مشاركة الحجز', en:'Share booking' },
  shareCardSubtitle: { ar:'تأكيد حجز موعد', en:'Appointment confirmation' },
  shareBookingRef: { ar:'رقم الحجز', en:'Booking #' },
  shareClient:    { ar:'العميل', en:'Client' },
  shareService:   { ar:'الخدمة', en:'Service' },
  shareDate:      { ar:'التاريخ', en:'Date' },
  shareTime:      { ar:'الوقت', en:'Time' },
  shareProvider:  { ar:'مقدم الخدمة', en:'Provider' },
  shareWhatsapp:  { ar:'إرسال عبر واتساب ويب', en:'Send via WhatsApp Web' },
  sharePng:       { ar:'تحميل كصورة (PNG)', en:'Download as image (PNG)' },
  sharePdf:       { ar:'تحميل كـ PDF', en:'Download as PDF' },
  noPhoneWarning: { ar:'لا يوجد رقم هاتف مسجل لهذا المريض', en:'No phone number on file for this patient' },

  // ------- الحالات / Statuses -------
  statusBooked:   { ar:'محجوز', en:'Booked' },
  statusArrived:  { ar:'حضر', en:'Arrived' },
  statusDone:     { ar:'انتهى', en:'Done' },
  statusCancelled: { ar:'ملغي', en:'Cancelled' },

  // ------- تبديل اللغة / Language switcher -------
  langSwitchLabel: { ar:'EN', en:'AR' },
  langSwitchTitle: { ar:'التبديل إلى الإنجليزية', en:'Switch to Arabic' }
};

function getLang(){
  return localStorage.getItem('mas_lang') || 'ar';
}

function t(key){
  const entry = DICT[key];
  if(!entry) return key;
  return entry[getLang()] || entry.ar || key;
}

/** يضبط dir/lang على <html> فورًا (تُستدعى أيضًا من السكربت المضمّن أعلى كل صفحة) */
function applyDirection(lang){
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', lang === 'en' ? 'ltr' : 'rtl');
}

/** يملأ كل عناصر data-i18n / data-i18n-placeholder / data-i18n-title بالنص المترجم */
function applyTranslations(){
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.getAttribute('data-i18n-html'));
  });
}

/** يبني زر تبديل اللغة داخل .app-topbar إن وُجد */
function renderLanguageSwitcher(){
  const host = document.getElementById('langSwitcherHost');
  if(!host) return;
  host.innerHTML = `<button type="button" class="topbar-btn" id="langSwitchBtn" style="width:auto;padding:0 .8rem;font-weight:800;font-size:.78rem;" data-i18n-title="langSwitchTitle" title="${t('langSwitchTitle')}">${t('langSwitchLabel')}</button>`;
  document.getElementById('langSwitchBtn').addEventListener('click', toggleLanguage);
}

async function toggleLanguage(){
  const next = getLang() === 'ar' ? 'en' : 'ar';
  localStorage.setItem('mas_lang', next);
  // لو المستخدم مسجل دخول ومتصل بالـ API، احفظ اللغة في حسابه عشان تتزامن مع أي جهاز
  try{
    const raw = localStorage.getItem('mas_user');
    if(raw && typeof Api !== 'undefined' && Api.isConfigured()){
      const user = JSON.parse(raw);
      user.language = next;
      localStorage.setItem('mas_user', JSON.stringify(user));
      await Api.updateUserLanguage(user.id, next);
    }
  } catch(e){ /* تجاهل أي خطأ في حفظ اللغة، مش مانع من تبديل الواجهة */ }
  window.location.reload();
}

document.addEventListener('DOMContentLoaded', () => {
  applyTranslations();
  renderLanguageSwitcher();
});
