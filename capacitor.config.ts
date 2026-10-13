import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dawood.brutaltodo',
  appName: 'BrutalTodo',
  webDir: 'dist',
  // The web build is fully local (no remote assets), so it can be served from
  // the app's own scheme — required for the Filesystem/Share plugins to work.
  android: {
    // Yellow, matching the app: the WebView flashes this while it boots.
    backgroundColor: '#FFD84D',
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
