package com.numyar.totichat.staging;

import androidx.annotation.NonNull;
import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;

/**
 * Native side of the opt-in TotiPush bridge.
 * This source is staged separately because CI recreates android/ on every APK build.
 * It must only be copied into CI after Firebase config for the exact staging
 * applicationId is supplied, and MainActivity registers this plugin.
 */
@CapacitorPlugin(name = "TotiPush")
public final class TotiPushPlugin extends Plugin {
    @PluginMethod
    public void consumeOpenMessagesIntent(PluginCall call) {
        Intent intent = getActivity().getIntent();
        boolean openMessages = intent != null
            && "com.numyar.totichat.staging.OPEN_MESSAGES".equals(intent.getAction());
        if (openMessages) {
            intent.setAction(Intent.ACTION_MAIN);
            getActivity().setIntent(intent);
        }
        JSObject result = new JSObject();
        result.put("openMessages", openMessages);
        call.resolve(result);
    }

    @PluginMethod
    public void getToken(PluginCall call) {
        if (FirebaseApp.getApps(getContext()).isEmpty()) {
            call.reject("Firebase is not initialized for this Android application");
            return;
        }
        FirebaseMessaging.getInstance().getToken()
            .addOnSuccessListener(token -> {
                if (token == null || token.isEmpty()) {
                    call.reject("FCM token unavailable");
                    return;
                }
                JSObject result = new JSObject();
                result.put("token", token);
                call.resolve(result);
            })
            .addOnFailureListener(error ->
                call.reject("Unable to retrieve FCM token", error));
    }

    /**
     * Called by the matching FirebaseMessagingService when Google rotates
     * the installation token. Do not persist it as an authenticated user here.
     * JavaScript validates the Supabase session before database registration.
     */
    public void tokenChanged(@NonNull String token) {
        if (token.isEmpty()) return;
        JSObject result = new JSObject();
        result.put("token", token);
        notifyListeners("tokenChanged", result, true);
    }
}
