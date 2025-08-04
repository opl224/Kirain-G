import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.notasphere.app',
  appName: 'NotaSphere',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
};

export default config;
