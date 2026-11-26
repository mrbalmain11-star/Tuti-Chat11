import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { fetchSharedRoom, nativeRoomLinkId } from './services/roomShare';
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
import { GlobalGiftBanner } from './components/GlobalGiftBanner';
import { UserLevelUpBanner } from './components/UserLevelUpBanner';
import { VipActivationBanner } from './components/VipActivationBanner';
import { CpRelationshipBanner } from './components/CpRelationshipBanner';
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
import { stagingBackend } from './services/stagingBackend';
import { mapRoomToUi } from './services/mapRoomToUi';
import { consumeNativeOpenMessagesIntent, listenForNativeOpenMessages } from './services/nativePushBridge';

// Staging APK OTP UI test: enabled by default; VITE_GOOGLE_EMAIL_OTP_ENFORCED=false disables it.
// Server enforcement remains separately disabled until end-to-end email/session tests pass.
const pendingRoomLinkKey = 'totichat:pending-room-link';

function clearPendingRoomLink(roomId: string) {
  try {
    if (nativeRoomLinkId(localStorage.getItem(pendingRoomLinkKey) ?? '') === roomId) {
      localStorage.removeItem(pendingRoomLinkKey);
    }
  } catch { /* The URL still carries the pending room for this session. */ }
}

const GOOGLE_EMAIL_OTP_ENFORCED = import.meta.env.VITE_GOOGLE_EMAIL_OTP_ENFORCED !== 'false';

async function withSessionDeadline<T>(work: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error('Session verification timed out'));
        }, 12000);
      }),
      work(controller.signal),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}



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
        <div className="min-h-screen bg-gradient-to-b from-[#042d27] via-[#07533f] to-[#031f1c] text-white flex flex-col items-center justify-center p-6 text-center" dir="rtl" role="alert">
          <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-[28px] border-2 border-amber-300/80 bg-gradient-to-br from-emerald-700 to-emerald-950 shadow-[0_8px_30px_rgba(0,0,0,.35)]">
            <svg viewBox="0 0 80 80" className="h-16 w-16" aria-hidden="true" focusable="false">
              <path d="M12 57 L18 22 L31 37 L40 13 L49 37 L62 22 L68 57 Z" fill="#d6a640" stroke="#fff0a8" strokeWidth="2.5" strokeLinejoin="round"/>
              <path d="M19 54 L23 33 L33 45 L40 26 L47 45 L57 33 L61 54 Z" fill="#087354" stroke="#fff0a8" strokeWidth="1.5"/>
              <path d="M12 60 H68 V67 H12 Z" fill="#f3cf6c" stroke="#fff0a8" strokeWidth="2"/>
              <circle cx="40" cy="42" r="4" fill="#e6fff0"/>
            </svg>
          </div>
          <h2 className="text-xl font-black text-amber-200 mb-2 font-['Cairo',sans-serif]">تعذر عرض التطبيق</h2>
          <p className="text-sm text-emerald-50/90 mb-6 max-w-xs leading-7">
            حدث خطأ غير متوقع أثناء عرض الواجهة. يمكنك إعادة تشغيلها والمحاولة مجدداً.
          </p>
          <button
            type="button"
            onClick={() => {
              // Preserve cached profile data when recovering from a UI crash.
              window.location.reload();
            }}
            className="min-h-11 rounded-xl border border-amber-200 bg-gradient-to-b from-[#f9e4a0] to-[#d5a13a] px-7 py-2.5 text-sm font-black text-[#254a35] shadow-[0_4px_14px_rgba(0,0,0,.22)] active:scale-95 transition"
          >
            إعادة تشغيل الواجهة
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, isLoggedIn, isRtl, rooms, enterRoom, activeRoom, setIsRoomMinimized } = useApp();
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
    const client = stagingBackend;
    let mounted = true;
    let attempt = 0;
    const check = async () => {
      const current = ++attempt;
      try {
        const result = await withSessionDeadline(async signal => {
          const { data: { session }, error: sessionError } = await client.auth.getSession();
          if (sessionError || !session) throw sessionError ?? new Error('Session unavailable');
          if (signal.aborted) throw new Error('Session verification timed out');
          const { data, error } = await client.rpc('otp_session_verified').abortSignal(signal);
          if (error) throw error;
          return { email: session.user.email ?? '', verified: data === true };
        });
        if (!mounted || current !== attempt) return;
        setOtpEmail(result.email);
        setOtpState(result.verified ? 'verified' : 'pending');
      } catch (error) {
        if (!mounted || current !== attempt) return;
        console.error('OTP session check failed:', error);
        setOtpState('error');
      }
    };
    void check();
    // Defer client calls until Supabase releases its auth callback lock.
    let scheduled: ReturnType<typeof setTimeout> | undefined;
    const { data: { subscription } } = client.auth.onAuthStateChange((event) => {
      if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') return;
      if (scheduled !== undefined) clearTimeout(scheduled);
      if (event === 'SIGNED_OUT') {
        attempt += 1;
        setOtpEmail('');
        setOtpState('checking');
        return;
      }
      scheduled = setTimeout(() => { void check(); }, 0);
    });
    window.addEventListener('online', check);
    return () => {
      mounted = false;
      if (scheduled !== undefined) clearTimeout(scheduled);
      subscription.unsubscribe();
      window.removeEventListener('online', check);
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

  const [roomLinkRevision, setRoomLinkRevision] = React.useState(0);
  React.useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let active = true;
    const accept = (raw: string) => {
      const id = nativeRoomLinkId(raw);
      if (!active || !id) return;
      const url = new URL(window.location.href);
      try { localStorage.setItem(pendingRoomLinkKey, raw); } catch { /* Keep the address-bar intent. */ }
      url.searchParams.set('room', id);
      window.history.replaceState(window.history.state, '', url);
      setRoomLinkRevision(value => value + 1);
    };
    try { const saved = localStorage.getItem(pendingRoomLinkKey); if (saved) accept(saved); } catch { /* No pending room to restore. */ }
    const subscription = CapacitorApp.addListener('appUrlOpen', event => accept(event.url));
    void subscription.catch(console.error);
    void CapacitorApp.getLaunchUrl().then(event => { if (event?.url) accept(event.url); }).catch(console.error);
    return () => { active = false; void subscription.then(handle => handle.remove()).catch(console.error); };
  }, []);

  // Open a shared room only after authentication, OTP and onboarding are complete.
  React.useEffect(() => {
    if (!isLoggedIn || (GOOGLE_EMAIL_OTP_ENFORCED && otpState !== 'verified') || onboardingState !== 'complete') return;
    const url = new URL(window.location.href);
    const roomId = url.searchParams.get('room');
    if (!roomId) return;
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(roomId)) {
      url.searchParams.delete('room');
      window.history.replaceState(window.history.state, '', url.toString());
      alert('رابط الغرفة غير صالح.');
      return;
    }
    if (sharedRoomLookupRef.current === roomId) return;
    sharedRoomLookupRef.current = roomId;
    void fetchSharedRoom(roomId).then(async target => {
      if (!target) {
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.get('room') === roomId) {
          clearPendingRoomLink(roomId);
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
      clearPendingRoomLink(roomId);
      currentUrl.searchParams.delete('room');
      window.history.replaceState(window.history.state, '', currentUrl.toString());
      if (activeRoom?.id === roomId) setIsRoomMinimized(false);
      else enterRoom(roomId, mapRoomToUi(target));
    }).catch(error => {
      console.error('Shared room lookup failed:', error);
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.get('room') !== roomId) return;
      clearPendingRoomLink(roomId);
      currentUrl.searchParams.delete('room');
      window.history.replaceState(window.history.state, '', currentUrl.toString());
      alert('تعذر التحقق من رابط الغرفة بسبب الاتصال بالخادم. حاول فتح الرابط مجدداً.');
    })
      .finally(() => { if (sharedRoomLookupRef.current === roomId) sharedRoomLookupRef.current = null; });
  }, [isLoggedIn, otpState, onboardingState, activeRoom?.id, enterRoom, roomLinkRevision, setIsRoomMinimized]);

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
        <p className="text-sm text-slate-300">تحقق من الاتصال ثم حاول مجدداً.</p>
        <button type="button" onClick={() => { setOtpState('checking'); setOtpRetry(value => value + 1); }} className="rounded-xl bg-emerald-600 px-6 py-3 font-bold">إعادة المحاولة</button>
        <button type="button" onClick={() => { void stagingBackend?.auth.signOut(); }} className="rounded-xl border border-emerald-300/40 px-6 py-3 font-bold text-emerald-100">تسجيل الخروج والدخول مجدداً</button>
      </div>
    );
    return <GoogleEmailOtpScreen email={otpEmail}
      onVerified={() => {
        void (async () => {
          try {
            const { data, error } = await withSessionDeadline(async signal => stagingBackend!.rpc('otp_session_verified').abortSignal(signal));
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
        <GlobalGiftBanner />
        <UserLevelUpBanner />
        <VipActivationBanner />
        <CpRelationshipBanner />
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
