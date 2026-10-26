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
              try {
                localStorage.removeItem('toti_user_v3');
                localStorage.removeItem('toti_user_v4');
              } catch (_) {}
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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center text-slate-900 font-['Cairo',sans-serif]">
        <div className="w-full max-w-md min-h-screen bg-[#070216] flex flex-col relative shadow-2xl overflow-hidden border-x border-purple-900/40" dir={isRtl ? 'rtl' : 'ltr'}>
          <AuthScreen />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0ECE1] flex justify-center text-slate-900 font-['Cairo',sans-serif] selection:bg-amber-500 selection:text-white" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Mobile Shell Frame */}
      <div className={`w-full max-w-md min-h-screen flex flex-col relative shadow-2xl overflow-x-hidden ${activeTab === 'home' || activeTab === 'messages' ? 'bg-[#FAF8F5]' : 'bg-[#FDFBF7]'} border-x border-amber-200/60`}>
        {/* Top Header shown on Home */}
        {activeTab === 'home' && <Header />}

        {/* Dynamic Main View */}
        <main className="flex-1">
          {activeTab === 'home' && <HomeView />}
          {activeTab === 'messages' && <MessagesView />}
          {activeTab === 'profile' && <ProfileView />}
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
