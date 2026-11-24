import { useEffect, useEffectEvent } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useApp } from '../context/AppContext';

function handleScreenBack(screen: 'admin' | 'room') {
  return !window.dispatchEvent(new Event('totichat:back:' + screen, { cancelable: true }));
}

export function AndroidSystemBack() {
  const app = useApp();
  const onBack = useEffectEvent(() => {
    if (app.openInviteModal) app.setOpenInviteModal(false);
    else if (app.openInternalProfileModal) app.setOpenInternalProfileModal(false);
    else if (app.openWealthLeaderboardModal) app.setOpenWealthLeaderboardModal(false);
    else if (app.openLanguageModal) app.setOpenLanguageModal(false);
    else if (app.openReportModal) app.setOpenReportModal(false);
    else if (app.openChatThread) app.setOpenChatThread(null);
    else if (app.openRechargeModal) app.setOpenRechargeModal(false);
    else if (app.openSettingsModal) app.setOpenSettingsModal(false);
    else if (app.openHonorModal) app.setOpenHonorModal(false);
    else if (app.openStorageModal) app.setOpenStorageModal(false);
    else if (app.openCreateRoomModal) app.setOpenCreateRoomModal(false);
    else if (app.openSearchModal) app.setOpenSearchModal(false);
    else if (app.openEditProfileModal) app.setOpenEditProfileModal(false);
    else if (app.openAgencyModal) app.setOpenAgencyModal(false);
    else if (app.openVipModal) app.setOpenVipModal(false);
    else if (app.openLevelsModal) app.setOpenLevelsModal(false);
    else if (app.openGiftStore) app.setOpenGiftStore(false);
    else if (app.activeRoom && !app.isRoomMinimized && handleScreenBack('room')) return;
    else if (app.activeTab === 'profile' && handleScreenBack('admin')) return;
    else if (app.activeTab !== 'home') app.setActiveTab('home');
    else if (app.activeRoom && handleScreenBack('room')) return;
    else void CapacitorApp.minimizeApp().catch(console.error);
  });

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;
    let active = true;
    const subscription = CapacitorApp.addListener('backButton', () => {
      if (active) onBack();
    });
    void subscription.catch(console.error);
    return () => {
      active = false;
      void subscription.then(handle => handle.remove()).catch(console.error);
    };
  }, []);

  return null;
}
