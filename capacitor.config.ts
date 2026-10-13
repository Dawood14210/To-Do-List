import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dawood.brutaltodo',
  appName: 'BrutalTodo',
  webDir: 'dist',
  // The web build is fully local (no remote assets), so it can be served from
  // the app's own scheme — required for the Filesystem/Share plugins to work.
  android: {
    // Cream, matching the splash and the app background, so the WebView never
    // flashes a different colour after the splash.
    backgroundColor: '#FFF4E0',
    allowMixedContent: false,
    captureInput: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_brutal',
      iconColor: '#FFD84D',
    },
  },
};

export default config;
