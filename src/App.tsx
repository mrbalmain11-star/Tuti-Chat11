import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './views/HomeView';
import { MessagesView } from './views/MessagesView';
import { ProfileView } from './views/ProfileView';

// Modals & Overlays
import { VoiceRoomModal } from './components/VoiceRoomModal';
import { GiftStoreModal } from './components/GiftStoreModal';
import { GiftAnimationOverlay } from './components/GiftAnimationOverlay';
import { RechargeModal } from './components/RechargeModal';
import { LevelsModal } from './components/LevelsModal';
import { VipModal } from './components/VipModal';
import { AgencyModal } from './components/AgencyModal';
import { EditProfileModal } from './components/EditProfileModal';
import { SearchModal } from './components/SearchModal';
import { OffersPopup } from './components/OffersPopup';
import { DirectChatModal } from './components/DirectChatModal';
import { CreateRoomModal } from './components/CreateRoomModal';
import { StorageModal } from './components/StorageModal';
import { HonorModal } from './components/HonorModal';
import { SettingsModal } from './components/SettingsModal';
import { ReportModal } from './components/ReportModal';
import { LanguageModal } from './components/LanguageModal';
import { InternalProfileModal } from './components/InternalProfileModal';
import { WealthLeaderboardModal } from './components/WealthLeaderboardModal';
import { InviteModal } from './components/InviteModal';
import { AuthScreen } from './components/AuthScreen';
import { GoogleEmailOtpScreen } from './components/GoogleEmailOtpScreen';
import { CompleteAccountScreen } from './components/CompleteAccountScreen';
import { stagingBackend, fetchRealRooms } from './services/stagingBackend';
import { mapRoomToUi } from './services/mapRoomToUi';
import { consumeNativeOpenMessagesIntent, listenForNativeOpenMessages } from './services/nativePushBridge';

// Staging APK OTP UI test: enabled by default; VITE_GOOGLE_EMAIL_OTP_ENFORCED=false disables it.
// Server enforcement remains separately disabled until end-to-end email/session tests pass.
const GOOGLE_EMAIL_OTP_ENFORCED = import.meta.env.VITE_GOOGLE_EMAIL_OTP_ENFORCED !== 'false';


class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App runtime error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070216] text-white flex flex-col items-center justify-center p-6 text-center" dir="rtl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl mb-4">
            👑
          </div>
          <h2 className="text-xl font-bold text-emerald-400 mb-2 font-['Cairo',sans-serif]">توتي شات الملكي</h2>
          <p className="text-sm text-slate-300 mb-6 max-w-xs">
            حدث تحديث في البيانات، اضغط على الزر أدناه لإعادة تشغيل الواجهة بسلاسة.
          </p>
          <button
            onClick={() => {
              // Preserve cached profile data when recovering from a UI crash.
              window.location.reload();
            }}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 active:scale-95 transition"
          >
            إعادة تشغيل التطبيق 🔄
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, isLoggedIn, isRtl, rooms, enterRoom, activeRoom } = useApp();
  const [dmNotice, setDmNotice] = React.useState(false);
  React.useEffect(() => {
    const onMessage = () => {
      if (!document.hidden) setDmNotice(true);
    };
    window.addEventListener('totichat:dm-received', onMessage);
    return () => window.removeEventListener('totichat:dm-received', onMessage);
  }, []);
  const [otpState, setOtpState] = React.useState<'checking' | 'pending' | 'verified' | 'error'>('checking');
  const [otpEmail, setOtpEmail] = React.useState('');
  const [otpRetry, setOtpRetry] = React.useState(0);
  const [onboardingState, setOnboardingState] = React.useState<'checking' | 'required' | 'complete' | 'error'>('checking');
  const [onboardingRetry, setOnboardingRetry] = React.useState(0);
  React.useEffect(() => {
    if (!isLoggedIn || (GOOGLE_EMAIL_OTP_ENFORCED && otpState !== 'verified') || !stagingBackend) {
      setOnboardingState('checking');
      return;
    }
    let active = true;
    const checkProfile = async () => {
      try {
        const { data: { user }, error: userError } = await stagingBackend!.auth.getUser();
        if (userError || !user) throw userError ?? new Error('No session');
        const { data, error } = await stagingBackend!.from('profiles').select('onboarding_completed').eq('id',user.id).maybeSingle();
        if (error) throw error;
        if (active) setOnboardingState(data?.onboarding_completed === true ? 'complete' : 'required');
      } catch (error) {
        console.error('Account completion check failed:', error);
        if (active) setOnboardingState('error');
      }
    };
    void checkProfile();
    return () => { active = false; };
  }, [isLoggedIn, otpState, onboardingRetry]);
  React.useEffect(() => {
    if (!GOOGLE_EMAIL_OTP_ENFORCED || !stagingBackend) return;
    let mounted = true;
    const check = async () => {
      // Supabase may emit SIGNED_IN again when Android returns from the file picker.
      // Never unmount the active room by switching an already verified session to 'checking'.
      try {
        const { data: session, error: sessionError } = await stagingBackend!.auth.getSession();
        if (!mounted) return;
        if (sessionError) { setOtpState('error'); return; }
        if (!session.session) { setOtpState('error'); return; }
        setOtpEmail(session.session.user.email ?? '');
        const { data, error } = await stagingBackend!.rpc('otp_session_verified');
        if (!mounted) return;
        setOtpState(error ? 'error' : data === true ? 'verified' : 'pending');
      } catch (error) {
        console.error('OTP session check failed:', error);
        if (mounted) setOtpState('error');
      }
    };
    void check();
    // Supabase auth callbacks run under an internal auth lock. Defer client calls
    // outside the callback to avoid getSession()/RPC deadlocks.
    let scheduled: ReturnType<typeof setTimeout> | undefined;
    const { data: { subscription } } = stagingBackend.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        if (scheduled !== undefined) clearTimeout(scheduled);
        scheduled = setTimeout(() => { void check(); }, 0);
      }
    });
    return () => {
      mounted = false;
      if (scheduled !== undefined) clearTimeout(scheduled);
      subscription.unsubscribe();
    };
  }, [otpRetry]);

  const sharedRoomLookupRef = React.useRef<string | null>(null);
  // Respect account verification before routing a notification to private messages.
  React.useEffect(() => {
    if (!isLoggedIn || (GOOGLE_EMAIL_OTP_ENFORCED && otpState !== 'verified') || onboardingState !== 'complete') return;
    let mounted = true;
    let removeListener: (() => Promise<void>) | undefined;
    void listenForNativeOpenMessages(() => {
      if (mounted) setActiveTab('messages');
    }).then(remove => {
      if (mounted) removeListener = remove;
      else void remove();
    }).catch(() => {});
    void consumeNativeOpenMessagesIntent().then(openMessages => {
      if (mounted && openMessages) setActiveTab('messages');
    });
    return () => {
      mounted = false;
      if (removeListener) void removeListener();
    };
  }, [isLoggedIn, otpState, onboardingState, setActiveTab]);

  // Open a shared room only after authentication, OTP and onboarding are complete.
  React.useEffect(() => {
    if (!isLoggedIn || (GOOGLE_EMAIL_OTP_ENFORCED && otpState !== 'verified') || onboardingState !== 'complete') return;
    // Do not interrupt an existing voice room when a share link is processed.
    if (activeRoom) return;
    const url = new URL(window.location.href);
    const roomId = url.searchParams.get('room');
    if (!roomId) return;
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(roomId)) {
      url.searchParams.delete('room');
      window.history.replaceState(window.history.state, '', url.toString());
      alert('رابط الغرفة غير صالح.');
      return;
    }
    const available = rooms.find(room => room.id === roomId);
    if (available) {
      url.searchParams.delete('room');
      window.history.replaceState(window.history.state, '', url.toString());
      enterRoom(roomId);
      return;
    }
    // Avoid duplicate network lookups while the room list and context rerender.
    if (sharedRoomLookupRef.current === roomId) return;
    sharedRoomLookupRef.current = roomId;
    void fetchRealRooms().then(async rows => {
      const target = rows.find(room => room.id === roomId);
      if (!target) {
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.get('room') === roomId) {
          currentUrl.searchParams.delete('room');
          window.history.replaceState(window.history.state, '', currentUrl.toString());
          alert('الغرفة غير متاحة حالياً أو لا تملك صلاحية الوصول إليها.');
        }
        return;
      }
      // The user may have signed out while the shared-room lookup was pending.
      const { data: auth, error: authError } = await stagingBackend!.auth.getUser();
      if (authError || !auth.user) return;
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.get('room') !== roomId) return;
      currentUrl.searchParams.delete('room');
      window.history.replaceState(window.history.state, '', currentUrl.toString());
      enterRoom(roomId, mapRoomToUi(target));
    }).catch(error => {
      console.error('Shared room lookup failed:', error);
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.get('room') !== roomId) return;
      currentUrl.searchParams.delete('room');
      window.history.replaceState(window.history.state, '', currentUrl.toString());
      alert('تعذر التحقق من رابط الغرفة بسبب الاتصال بالخادم. حاول فتح الرابط مجدداً.');
    })
      .finally(() => { if (sharedRoomLookupRef.current === roomId) sharedRoomLookupRef.current = null; });
  }, [isLoggedIn, otpState, onboardingState, rooms, enterRoom, activeRoom]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center text-slate-900 font-['Cairo',sans-serif]">
        <div className="w-full max-w-md min-h-screen bg-[#070216] flex flex-col relative shadow-2xl overflow-hidden border-x border-purple-900/40" dir={isRtl ? 'rtl' : 'ltr'}>
          <AuthScreen />
        </div>
      </div>
    );
  }

  if (GOOGLE_EMAIL_OTP_ENFORCED && otpState !== 'verified') {
    if (otpState === 'checking') {
      return <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[#001d18] text-amber-300 font-['Cairo',sans-serif]">جارٍ فحص أمان الجلسة...</div>;
    }
    if (otpState === 'error') return (
      <div dir="rtl" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#001d18] px-6 text-center text-white">
        <p className="text-lg font-bold">تعذر فحص التحقق الأمني</p>
        <p className="text-sm text-slate-300">تحقق من الاتصال ثم حاول مجدداً. لن يتم تجاوز التحقق من OTP.</p>
        <button type="button" onClick={() => { setOtpState('checking'); setOtpRetry(value => value + 1); }} className="rounded-xl bg-emerald-600 px-6 py-3 font-bold">إعادة المحاولة</button>
        <button type="button" onClick={() => { void stagingBackend?.auth.signOut(); }} className="rounded-xl border border-emerald-300/40 px-6 py-3 font-bold text-emerald-100">تسجيل الخروج والدخول مجدداً</button>
      </div>
    );
    return <GoogleEmailOtpScreen email={otpEmail}
      onVerified={() => {
        void (async () => {
          try {
            const { data, error } = await stagingBackend!.rpc('otp_session_verified');
            if (error || data !== true) {
              setOtpState('error');
              return;
            }
            setOtpState('verified');
          } catch (error) {
            console.error('OTP confirmation check failed:', error);
            setOtpState('error');
          }
        })();
      }}
      onBack={() => { void stagingBackend?.auth.signOut(); }} />;
  }

  if (onboardingState === 'error') return (
    <div dir="rtl" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#001d18] px-6 text-center text-white">
      <p className="text-lg font-bold">تعذر التحقق من معلومات الحساب</p>
      <p className="text-sm text-slate-300">تحقق من الاتصال ثم حاول مجدداً. لن يتم تجاوز التحقق الأمني أو إنشاء ملف جديد تلقائياً.</p>
      <button type="button" onClick={() => { setOnboardingState('checking'); setOnboardingRetry(value => value + 1); }} className="rounded-xl bg-emerald-600 px-6 py-3 font-bold">إعادة المحاولة</button>
    </div>
  );
  if (onboardingState === 'checking') return <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[#001d18] text-amber-300">جارٍ تحميل معلومات الحساب...</div>;
  if (onboardingState === 'required') return <CompleteAccountScreen onComplete={() => setOnboardingState('complete')} />;

  return (
    <div className="min-h-screen bg-[#F0ECE1] flex justify-center text-slate-900 font-['Cairo',sans-serif] selection:bg-amber-500 selection:text-white" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Mobile Shell Frame */}
      <div className={`w-full max-w-md min-h-screen flex flex-col relative shadow-2xl overflow-x-hidden ${activeTab === 'home' || activeTab === 'messages' ? 'bg-[#FAF8F5]' : 'bg-[#FDFBF7]'} border-x border-amber-200/60`}>
        {/* Top Header shown on Home */}
        {activeTab === 'home' && <Header />}

        {/* Dynamic Main View */}
        <main className="flex-1 min-h-0" style={{ paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))" }}>
          <div style={{ display: activeTab === 'home' ? 'block' : 'none' }}><HomeView /></div>
          <div style={{ display: activeTab === 'messages' ? 'block' : 'none' }}><MessagesView /></div>
          <div style={{ display: activeTab === 'profile' ? 'block' : 'none' }}><ProfileView /></div>
        </main>

        {dmNotice && activeTab !== 'messages' && (
          <div role="status" className="fixed top-16 left-1/2 z-[90] w-[min(90vw,24rem)] -translate-x-1/2 rounded-xl border border-emerald-300 bg-white p-3 text-right shadow-xl" dir="rtl">
            <p className="text-sm font-bold text-emerald-900">وصلتك رسالة خاصة جديدة</p>
            <button type="button" onClick={() => setDmNotice(false)} className="mt-2 text-xs font-bold text-emerald-700">إغلاق التنبيه</button>
          </div>
        )}
        {/* Bottom Navigation */}
        <BottomNav />

        {/* Global Overlays & Modals */}
        <VoiceRoomModal />
        <GiftStoreModal />
        <GiftAnimationOverlay />
        <RechargeModal />
        <LevelsModal />
        <VipModal />
        <AgencyModal />
        <EditProfileModal />
        <SearchModal />
        <OffersPopup />
        <DirectChatModal />
        <CreateRoomModal />
        <StorageModal />
        <HonorModal />
        <SettingsModal />
        <ReportModal />
        <LanguageModal />
        <InternalProfileModal />
        <WealthLeaderboardModal />
        <InviteModal />
      </div>
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
