import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kiraing.app',
  appName: 'Kirain\'G',
  webDir: 'out',
  server: {
    hostname: 'localhost',
    androidScheme: 'https',
  },
};

export default config;
