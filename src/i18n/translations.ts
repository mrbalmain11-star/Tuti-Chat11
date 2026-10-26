export type Language = 'ar' | 'en';

export interface Translations {
  // Navigation
  navHome: string;
  navRoyal: string;
  navMoments: string;
  navMessages: string;
  navProfile: string;

  // Header Sub-Tabs
  tabParty: string;
  tabRoyal: string;
  tabDiscover: string;
  searchPlaceholder: string;
  createRoom: string;

  // Category Cards
  cardWealth: string;
  cardCharm: string;
  cardRoom: string;
  cardWealthSubtitle: string;
  cardCharmSubtitle: string;
  cardRoomSubtitle: string;

  // Leaderboard Modal
  throneOfSupporters: string;
  wealthListTitle: string;
  charmListTitle: string;
  roomListTitle: string;
  wealthListSubtitle: string;
  charmListSubtitle: string;
  roomListSubtitle: string;
  timeDaily: string;
  timeWeekly: string;
  timeMonthly: string;
  resetQuestion: string;
  resetDailyText: string;
  resetWeeklyText: string;
  resetMonthlyText: string;
  supportersListLabel: string;
  roomsListLabel: string;
  thrownToAccount: string;
  thrownToRoom: string;
  increaseCharm: string;
  enterRoom: string;
  understood: string;
  resetDialogTitle: string;
  resetOfficialTimes: string;
  resetDailyDetail: string;
  resetWeeklyDetail: string;
  resetMonthlyDetail: string;
  calculationRulesTitle: string;
  calcWealth: string;
  calcCharm: string;
  calcRoom: string;

  // Settings
  settingsTitle: string;
  accountSecurity: string;
  permissions: string;
  broadcastNotification: string;
  blockGoToRoom: string;
  friendsChatOnly: string;
  messageNotifications: string;
  simpleMode: string;
  networkFix: string;
  clearCache: string;
  userAgreement: string;
  privacyPolicy: string;
  appVersion: string;
  deleteAccount: string;
  logout: string;
  languageSettings: string;
  save: string;
  back: string;
  savedSuccessfully: string;
  autoSystemLang: string;
  autoSystemDesc: string;
  recommended: string;
  arabicLang: string;
  englishLang: string;
  arabicSub: string;
  englishSub: string;
  langAppliedNotice: string;

  // Profile View
  myLevel: string;
  wealthLevel: string;
  charmLevel: string;
  agencyCenter: string;
  wallet: string;
  backpack: string;
  vipCenter: string;
  inviteFriends: string;
  uploadLogs: string;
  followers: string;
  following: string;
  friends: string;
  visitors: string;
  userId: string;
  copy: string;
  recharge: string;
  newUserReward: string;
  coins: string;
  diamonds: string;

  // Rooms & Filters
  allFilter: string;
  popularFilter: string;
  onlineNow: string;
  joinRoom: string;
  activeRooms: string;
}

export const translations: Record<Language, Translations> = {
  ar: {
    // Navigation
    navHome: 'الصفحة الرئيسية',
    navRoyal: 'ملكي',
    navMoments: 'اللحظات',
    navMessages: 'رسالة',
    navProfile: 'أنا',

    // Header Sub-Tabs
    tabParty: 'حفلة',
    tabRoyal: 'ملكي',
    tabDiscover: 'استكشاف',
    searchPlaceholder: 'بحث...',
    createRoom: 'إنشاء غرفة',

    // Category Cards
    cardWealth: 'الثروة',
    cardCharm: 'الجاذبية',
    cardRoom: 'الغرفة',
    cardWealthSubtitle: 'أعلى الداعمين',
    cardCharmSubtitle: 'مرمي للحساب',
    cardRoomSubtitle: 'مرمي للروم',

    // Leaderboard Modal
    throneOfSupporters: 'عرش كبار الداعمين',
    wealthListTitle: 'قائمة داعمي الثروة',
    charmListTitle: 'قائمة الجاذبية والشعبية',
    roomListTitle: 'قائمة دعم الرومات',
    wealthListSubtitle: 'أعلى حسابات الدعم (توب 1، 2، 3 و 7 داعمين)',
    charmListSubtitle: 'مستوى السحر وقيمة المرمي للحساب (مرسل له)',
    roomListSubtitle: 'دعم الرومات وقيمة المرمي للروم',
    timeDaily: 'اليوم',
    timeWeekly: 'أسبوعي',
    timeMonthly: 'شهري',
    resetQuestion: 'سؤال متى يتم إعادة الضبط؟',
    resetDailyText: 'إعادة الضبط: يومياً الساعة 00:00 منتصف الليل',
    resetWeeklyText: 'إعادة الضبط: أسبوعياً ليلة الأحد الساعة 00:00',
    resetMonthlyText: 'إعادة الضبط: شهرياً في 1 من كل شهر ميلادي الساعة 00:00',
    supportersListLabel: 'قائمة الداعمين (4 - 10)',
    roomsListLabel: 'قائمة الرومات (4 - 10)',
    thrownToAccount: 'مرمي للحساب',
    thrownToRoom: 'مرمي للروم',
    increaseCharm: 'زيادة الجاذبية',
    enterRoom: 'دخول الروم',
    understood: 'حسناً، فهمت',
    resetDialogTitle: 'سؤال: متى يتم إعادة الضبط؟',
    resetOfficialTimes: 'مواعيد إعادة الضبط الرسمية:',
    resetDailyDetail: 'يتم تصفير وإعادة ضبط قائمة الداعمين يومياً في تمام الساعة 00:00 منتصف الليل بتوقيت مكة المكرمة وبغداد (GMT+3).',
    resetWeeklyDetail: 'يتم إعادة ضبط القائمة أسبوعياً كل ليلة أحد عند الساعة 00:00 منتصف الليل (بداية يوم الاثنين).',
    resetMonthlyDetail: 'يتم إعادة ضبط القائمة شهرياً في اليوم الأول من كل شهر ميلادي عند الساعة 00:00 منتصف الليل.',
    calculationRulesTitle: 'كيفية احتساب النقاط والمراكز:',
    calcWealth: 'الثروة: تُحتسب بقيمة مجموع العملات 🪙 المنفقة في إرسال الهدايا ودعم الغرف.',
    calcCharm: 'الجاذبية: تُحتسب بإجمالي قيمة الهدايا والألماس 💎 المستلمة في الحساب الشخصي (مرمي للحساب).',
    calcRoom: 'الغرفة: تُحتسب بإجمالي الهدايا 💎 المرمية داخل الغرفة من كافة الزوار والداعمين.',

    // Settings
    settingsTitle: 'الإعدادات',
    accountSecurity: 'الحساب والأمان',
    permissions: 'إعدادات الأذونات',
    broadcastNotification: 'عرض البث',
    blockGoToRoom: 'ممنوع الذهاب إلى الغرفة',
    friendsChatOnly: 'اقبل الدردشة مع الاصدقاء فقط',
    messageNotifications: 'إشعارات الرسائل',
    simpleMode: 'الوضع البسيط',
    networkFix: 'إصلاح الشبكة',
    clearCache: 'مسح ذاكرة التخزين المؤقت',
    userAgreement: 'اتفاقية المستخدم',
    privacyPolicy: 'سياسة الخصوصية',
    appVersion: 'الإصدار',
    deleteAccount: 'حذف الحساب',
    logout: 'تسجيل الخروج',
    languageSettings: 'إعدادات اللغة',
    save: 'حفظ',
    back: 'رجوع',
    savedSuccessfully: 'تم حفظ إعدادات اللغة بنجاح ✅',
    autoSystemLang: 'تلقائي (لغة النظام)',
    autoSystemDesc: 'مزامنة تلقائية مع لغة هاتفك',
    recommended: 'موصى به',
    arabicLang: 'العربية',
    englishLang: 'English',
    arabicSub: 'Arabic',
    englishSub: 'الإنجليزية',
    langAppliedNotice: '💡 يتم تطبيق اللغة المختارة فوراً على جميع شاشات وقوائم التطبيق.',

    // Profile View
    myLevel: 'مستواي',
    wealthLevel: 'مستوى الثروة',
    charmLevel: 'مستوى السحر',
    agencyCenter: 'مركز الوكالة',
    wallet: 'المحفظة',
    backpack: 'حقيبتي',
    vipCenter: 'مركز VIP',
    inviteFriends: 'دعوة',
    uploadLogs: 'رفع السجلات',
    followers: 'المتابعون',
    following: 'المتابعة',
    friends: 'الأصدقاء',
    visitors: 'الزوار',
    userId: 'ID',
    copy: 'نسخ',
    recharge: 'شحن',
    newUserReward: 'مكافأة مستخدم جديد',
    coins: 'عملات',
    diamonds: 'ألماس',

    // Rooms & Filters
    allFilter: 'الكل',
    popularFilter: 'شائع 🔥',
    onlineNow: 'متصل الآن',
    joinRoom: 'انضمام',
    activeRooms: 'الغرف النشطة',
  },
  en: {
    // Navigation
    navHome: 'Home',
    navRoyal: 'Royal',
    navMoments: 'Moments',
    navMessages: 'Messages',
    navProfile: 'Me',

    // Header Sub-Tabs
    tabParty: 'Party',
    tabRoyal: 'Royal',
    tabDiscover: 'Discover',
    searchPlaceholder: 'Search...',
    createRoom: 'Create Room',

    // Category Cards
    cardWealth: 'Wealth',
    cardCharm: 'Charm',
    cardRoom: 'Room',
    cardWealthSubtitle: 'Top Supporters',
    cardCharmSubtitle: 'Gifts Received',
    cardRoomSubtitle: 'Room Gifts',

    // Leaderboard Modal
    throneOfSupporters: 'Throne of Top Supporters',
    wealthListTitle: 'Wealth Supporters Leaderboard',
    charmListTitle: 'Charm & Popularity Leaderboard',
    roomListTitle: 'Room Support Leaderboard',
    wealthListSubtitle: 'Top supporters rankings (#1, #2, #3 and top 7)',
    charmListSubtitle: 'Magic level and gifts received to profile',
    roomListSubtitle: 'Room support and gifts sent to room',
    timeDaily: 'Daily',
    timeWeekly: 'Weekly',
    timeMonthly: 'Monthly',
    resetQuestion: 'When is the reset?',
    resetDailyText: 'Reset: Daily at 00:00 Midnight',
    resetWeeklyText: 'Reset: Weekly Sunday 00:00 Midnight',
    resetMonthlyText: 'Reset: Monthly on the 1st at 00:00',
    supportersListLabel: 'Supporters List (4 - 10)',
    roomsListLabel: 'Rooms List (4 - 10)',
    thrownToAccount: 'Received Gifts',
    thrownToRoom: 'Room Gifts',
    increaseCharm: 'Boost Charm',
    enterRoom: 'Enter Room',
    understood: 'Understood',
    resetDialogTitle: 'Question: When is the reset?',
    resetOfficialTimes: 'Official Reset Times:',
    resetDailyDetail: 'Daily rankings are reset every day at 00:00 Midnight (Baghdad / Mecca GMT+3).',
    resetWeeklyDetail: 'Weekly rankings are reset every Sunday night at 00:00 Midnight (beginning of Monday).',
    resetMonthlyDetail: 'Monthly rankings are reset on the 1st day of every month at 00:00 Midnight.',
    calculationRulesTitle: 'Points & Ranking Calculation:',
    calcWealth: 'Wealth: Calculated based on total coins 🪙 spent on gifts and room support.',
    calcCharm: 'Charm: Calculated based on total diamonds 💎 received to the personal profile.',
    calcRoom: 'Room: Calculated based on total gifts 💎 sent inside the room by all visitors.',

    // Settings
    settingsTitle: 'Settings',
    accountSecurity: 'Account & Security',
    permissions: 'Permissions Settings',
    broadcastNotification: 'Live Broadcast',
    blockGoToRoom: 'Prevent Jump to Room',
    friendsChatOnly: 'Accept Friends Chat Only',
    messageNotifications: 'Message Notifications',
    simpleMode: 'Simple Mode',
    networkFix: 'Network Diagnosis',
    clearCache: 'Clear Cache',
    userAgreement: 'User Agreement',
    privacyPolicy: 'Privacy Policy',
    appVersion: 'Version',
    deleteAccount: 'Delete Account',
    logout: 'Log Out',
    languageSettings: 'Language Settings',
    save: 'Save',
    back: 'Back',
    savedSuccessfully: 'Language settings saved successfully ✅',
    autoSystemLang: 'Auto (System Language)',
    autoSystemDesc: 'Sync automatically with phone language',
    recommended: 'Recommended',
    arabicLang: 'العربية',
    englishLang: 'English',
    arabicSub: 'Arabic',
    englishSub: 'English',
    langAppliedNotice: '💡 Selected language is applied immediately across all screens and menus.',

    // Profile View
    myLevel: 'My Level',
    wealthLevel: 'Wealth Level',
    charmLevel: 'Charm Level',
    agencyCenter: 'Agency Center',
    wallet: 'Wallet',
    backpack: 'Backpack',
    vipCenter: 'VIP Center',
    inviteFriends: 'Invite',
    uploadLogs: 'Upload Logs',
    followers: 'Followers',
    following: 'Following',
    friends: 'Friends',
    visitors: 'Visitors',
    userId: 'ID',
    copy: 'Copy',
    recharge: 'Recharge',
    newUserReward: 'New User Reward',
    coins: 'Coins',
    diamonds: 'Diamonds',

    // Rooms & Filters
    allFilter: 'All',
    popularFilter: 'Popular 🔥',
    onlineNow: 'Online Now',
    joinRoom: 'Join',
    activeRooms: 'Active Rooms',
  },
};
