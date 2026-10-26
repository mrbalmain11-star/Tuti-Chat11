import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.numyar.totichat.staging',
  appName: 'TotiChat Staging',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
