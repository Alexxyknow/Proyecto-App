import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { ScreenOrientation } from '@capacitor/screen-orientation';

/**
 * Initializes mobile native integrations when running inside Capacitor (Android/iOS)
 */
export async function initCapacitorPlugins() {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    // 1. Lock screen to landscape gaming orientation if supported
    try {
      await ScreenOrientation.lock({ orientation: 'landscape' });
    } catch {
      // Screen orientation lock might not be supported on all webviews or desktop debuggers
    }

    // 2. Configure StatusBar for full dark gaming immersive style
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#07070a' });
    } catch {
      // Ignore if not supported on platform
    }

    // 3. Hide Splash Screen with smooth fade
    try {
      await SplashScreen.hide({ fadeOutDuration: 400 });
    } catch {
      // Ignore if already hidden
    }
  } catch (error) {
    console.warn('Capacitor native initialization error:', error);
  }
}
