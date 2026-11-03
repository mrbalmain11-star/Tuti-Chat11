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
import { stagingBackend } from './services/stagingBackend';

// This flag MUST remain false until all server-side RLS/RPC/Storage/Edge gates are deployed.
const GOOGLE_EMAIL_OTP_ENFORCED = import.meta.env.VITE_GOOGLE_EMAIL_OTP_ENFORCED === 'true';


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
  const { activeTab, isLoggedIn, isRtl } = useApp();
  const [otpState, setOtpState] = React.useState<'checking' | 'pending' | 'verified'>('checking');
  const [otpEmail, setOtpEmail] = React.useState('');
  React.useEffect(() => {
    if (!GOOGLE_EMAIL_OTP_ENFORCED || !stagingBackend) return;
    let mounted = true;
    const check = async () => {
      if (mounted) setOtpState('checking');
      const { data: session } = await stagingBackend!.auth.getSession();
      if (!mounted) return;
      if (!session.session) { setOtpState('checking'); return; }
      setOtpEmail(session.session.user.email ?? '');
      const { data, error } = await stagingBackend!.rpc('otp_session_verified');
      if (!mounted) return;
      setOtpState(!error && data === true ? 'verified' : 'pending');
    };
    void check();
    const { data: { subscription } } = stagingBackend.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') void check();
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

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
    return <GoogleEmailOtpScreen email={otpEmail}
      onVerified={() => { void stagingBackend?.rpc('otp_session_verified').then(({ data, error }) => {
        if (!error && data === true) setOtpState('verified');
      }); }}
      onBack={() => { void stagingBackend?.auth.signOut(); }} />;
  }

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
