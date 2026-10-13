package com.dawood.brutaltodo;

import android.os.Bundle;
import android.os.SystemClock;
import android.view.View;

import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;

/**
 * BrutalTodo shell.
 *
 * Every Capacitor plugin is wired up automatically: `cap sync` writes the
 * installed plugin classes into `app/src/main/assets/capacitor.plugins.json`
 * and BridgeActivity registers whatever it finds there, so there is no manual
 * registration to keep in sync here. The web UI talks to them through the
 * helpers in `src/utils/`.
 *
 * The splash is held for about one second, then fades out quickly. The
 * launch theme's background matches the splash, so nothing flashes between
 * the splash and the first frame.
 */
public class MainActivity extends BridgeActivity {

    /** How long the splash stays fully visible. */
    private static final long SPLASH_HOLD_MS = 1000L;
    /** Fade-out duration once the hold is over. */
    private static final long SPLASH_FADE_MS = 200L;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        final long startedAt = SystemClock.uptimeMillis();
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        splashScreen.setKeepOnScreenCondition(
            () -> SystemClock.uptimeMillis() - startedAt < SPLASH_HOLD_MS
        );
        splashScreen.setOnExitAnimationListener(provider -> {
            View splashView = provider.getView();
            splashView.animate()
                .alpha(0f)
                .setDuration(SPLASH_FADE_MS)
                .withEndAction(provider::remove)
                .start();
        });

        super.onCreate(savedInstanceState);
    }
}
