/**
 * Login.jsx
 * Path: src/components/Login.jsx
 *
 * Google Sign-In screen for the React Native + Expo build. Uses
 * @react-native-google-signin/google-signin for the client-side OAuth step,
 * then POSTs the idToken to server.js's real /api/auth/google route to get
 * back verified player + wallet data (Mongo Player._id, name, email — see
 * server.js POST /api/auth/google). Google's own user.id/.photo from the
 * client SDK are NOT what the backend returns — player.id here is Mongo's
 * player._id, and there's no photo field from the backend at all, so photo
 * is kept from the client-side SDK response separately.
 *
 * Requires deviceId as a prop — server.js's /api/auth/google requires
 * deviceUUID in the request body (400 without it). App.js must pass its
 * deviceId down to this screen (see App.js's Login stack entry).
 *
 * NOTE: deviceUUID/gameplay identity (wallet, leaderboard, room-join) does
 * NOT depend on this call succeeding — server.js keys all of that on
 * deviceUUID directly, independent of the Player/Google-auth layer. This
 * screen failing doesn't block play; it only means account/profile data
 * (display name from Google, leaderboard attribution) won't be attached.
 *
 * ⚠️ FLAGGED: SERVER_BASE_URL below is a placeholder. Set it to whatever
 * host src/lib/gameClient.js connects its socket to — they must be the
 * same backend (this is an HTTP POST to the same Express app the socket
 * connects to, not a separate service).
 *
 * ONE-TIME SETUP (unchanged from before):
 * 1. npm install @react-native-google-signin/google-signin
 * 2. Google Cloud Console: Web client ID (used as GOOGLE_WEB_CLIENT_ID
 *    below, and must match server.js's GOOGLE_CLIENT_ID env var — the
 *    backend verifies the idToken's audience against that same ID) +
 *    Android client ID with your release/debug keystore SHA-1s.
 *    ⚠️ ALL OAuth clients (Web, Android debug, Android release) MUST live
 *    in the SAME Google Cloud project. Check the project dropdown at
 *    console.cloud.google.com/apis/credentials — if any client is in a
 *    different project, Google Play Services will complete sign-in but
 *    silently omit idToken.
 * 3. app.json — add plugin: ["@react-native-google-signin/google-signin"]
 * 4. Rebuild the dev client after adding the plugin.
 *
 * THIS REVISION —
 *   7. GoogleSignin.configure() now sets offlineAccess: true (was false)
 *      plus forceCodeForRefreshToken: true. Some versions of this SDK only
 *      reliably return `idToken` in userInfo when offlineAccess is true —
 *      with it false, sign-in can silently succeed with idToken: null.
 *      This is being tried alongside (not instead of) confirming all three
 *      OAuth client IDs share one GCP project — that project-mismatch issue
 *      produces the identical symptom and this config change won't fix it
 *      if that's the actual cause.
 *      NOTE: offlineAccess: true means userInfo will now also include a
 *      serverAuthCode. That's unused here (nothing on the backend consumes
 *      it) — harmless to ignore, but mentioning it since it's new.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

const GOOGLE_WEB_CLIENT_ID = '90180381725-jjrbi2uvlfq8ouk6fvmlgbho2k8qjdha.apps.googleusercontent.com'; // 🔧 replace — must match server.js GOOGLE_CLIENT_ID
const SERVER_BASE_URL = 'https://manifix-ai-core.onrender.com'; // 🔧 replace — must match gameClient.js's socket host
const AUTH_ENDPOINT = `${SERVER_BASE_URL}/api/auth/google`;

export default function Login({ onLoginSuccess, deviceId }) {
  const [configured, setConfigured] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
      scopes: ['profile', 'email'],
    });
    setConfigured(true);
  }, []);

  const handleSignIn = async () => {
    if (signingIn) return;

    if (!deviceId) {
      // Shouldn't happen if App.js boot resolved first, but the backend
      // hard-rejects (400) without a deviceUUID, so fail loudly instead
      // of sending a request we know will be rejected.
      Alert.alert('Not ready', 'Still setting up — try again in a moment.');
      return;
    }

    setSigningIn(true);

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      // userInfo: { idToken, serverAuthCode, scopes, user: { id, name, email, photo, ... } }

      // 🔍 DEBUG — remove once the missing-field cause is confirmed fixed.
      console.log(
        '[Login] DEBUG deviceId:',
        deviceId,
        '| idToken:',
        userInfo.idToken ? 'present' : 'MISSING'
      );

      if (!userInfo.idToken) {
        // Isolates cause #2: Google Sign-In UI succeeded but returned no
        // idToken. If this still fires after switching offlineAccess to
        // true, the remaining suspect is the OAuth-client-project mismatch
        // (Web/Android clients not in the same GCP project) — check
        // console.cloud.google.com/apis/credentials.
        Alert.alert(
          'Sign-in incomplete',
          'Google did not return an ID token. Check that the Web, Android debug, and Android release OAuth client IDs are all in the same Google Cloud project, and that GOOGLE_WEB_CLIENT_ID matches server.js\'s GOOGLE_CLIENT_ID.'
        );
        return;
      }

      const backendResponse = await fetch(AUTH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialToken: userInfo.idToken,
          deviceUUID: deviceId,
          deviceOS: Platform.OS.toUpperCase(), // 'ANDROID' | 'IOS'
        }),
      });

      const data = await backendResponse.json();

      if (!backendResponse.ok || !data.success) {
        Alert.alert('Sign-in failed', data.message || 'Server rejected the sign-in. Please try again.');
        return;
      }

      // data: { success, player: { id, name, email }, wallet }
      onLoginSuccess({
        userId: data.player.id,
        displayName: data.player.name,
        email: data.player.email,
        photoUrl: userInfo.user?.photo ?? null, // backend doesn't return this — kept from the client SDK
        googleIdToken: userInfo.idToken,
        wallet: data.wallet,
      });
    } catch (err) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        // user backed out — no alert needed
      } else if (err.code === statusCodes.IN_PROGRESS) {
        // sign-in already running — ignore duplicate tap
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Google Play Services required', 'Please update Google Play Services and try again.');
      } else {
        console.warn('[Login] sign-in failed:', err);
        Alert.alert('Sign-in failed', 'Something went wrong. Please try again.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Veggie Go</Text>
      <Text style={styles.subtitle}>Sign in with Google to sync your collection and matches.</Text>

      <TouchableOpacity
        style={[styles.button, (!configured || signingIn) && styles.buttonDisabled]}
        onPress={handleSignIn}
        disabled={!configured || signingIn}
        activeOpacity={0.85}
      >
        {signingIn ? (
          <ActivityIndicator size="small" color="#1A1F1B" />
        ) : (
          <Text style={styles.buttonText}>Continue with Google</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.legal}>
        By continuing, you agree to Veggie Go's Terms and Privacy Policy.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5EF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    width: 88,
    height: 88,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1F1B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E0D6',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 24,
    width: '100%',
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1F1B',
  },
  legal: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
  },
});
