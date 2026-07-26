// src/components/RoomJoin.jsx
// Polished, professional entry screen for Veggie Go. Same contract as
// before — onJoin({room, name}), error, connecting, initialRoomCode
// props, PrivacyModal/TermsModal links — with a more inviting visual
// treatment: subtle entrance animation, gradient accent, real logo.

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PrivacyModal from './PrivacyModal';
import TermsModal from './TermsModal';

const BG = '#0B0F14';
const CARD_BG = '#12171F';
const GREEN = '#34D399';
const GREEN_LIGHT = '#8FF0C4';
const INK = '#F4F7F5';
const MUTED = '#8A93A6';
const BORDER = 'rgba(255,255,255,0.08)';
const ERROR_RED = '#FF5A5A';

function generateArenaCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const pick = () => letters[Math.floor(Math.random() * letters.length)];
  return `${pick()}${pick()}${pick()}${Math.floor(100 + Math.random() * 900)}`;
}

function AnimatedGo() {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(bounce, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 260, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const translateY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const scale = bounce.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  return (
    <Animated.Text style={[styles.goAccent, { transform: [{ translateY }, { scale }] }]}>
      GO!
    </Animated.Text>
  );
}

function StepRow({ number, text, delay, fadeAnim }) {
  return (
    <Animated.View
      style={[
        styles.stepRow,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(52,211,153,0.25)', 'rgba(52,211,153,0.08)']}
        style={styles.stepBadge}
      >
        <Text style={styles.stepBadgeText}>{number}</Text>
      </LinearGradient>
      <Text style={styles.stepText}>{text}</Text>
    </Animated.View>
  );
}

export default function RoomJoin({ onJoin, error, connecting, initialRoomCode = '' }) {
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [playerName, setPlayerName] = useState('');
  const [focusField, setFocusField] = useState(null);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const step1Anim = useRef(new Animated.Value(0)).current;
  const step2Anim = useRef(new Animated.Value(0)).current;
  const step3Anim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const logoSpin = useRef(new Animated.Value(0)).current;
  const joinPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.stagger(90, [
        Animated.timing(step1Anim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(step2Anim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(step3Anim, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      Animated.timing(formAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(logoSpin, { toValue: 1, duration: 3500, useNativeDriver: true }),
        Animated.timing(logoSpin, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const canSubmit = Boolean(roomCode.trim() && playerName.trim() && !connecting);

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    Animated.sequence([
      Animated.timing(joinPulse, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(joinPulse, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onJoin({ room: roomCode.trim().toUpperCase(), name: playerName.trim() });
  }, [roomCode, playerName, canSubmit, onJoin]);

  const handleQuickMatch = () => {
    if (connecting) return;
    setRoomCode(generateArenaCode());
  };

  const logoRotate = logoSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['rgba(52,211,153,0.08)', 'transparent']}
        style={styles.topGlow}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* ── Logo / title ── */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: headerAnim,
                transform: [
                  { translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) },
                ],
              },
            ]}
          >
            <View style={styles.logoRing}>
              <Animated.View style={{ transform: [{ rotate: logoRotate }] }}>
                <LinearGradient colors={[GREEN, GREEN_LIGHT]} style={styles.logoBadge}>
                  <Text style={styles.logoBadgeText}>VG</Text>
                </LinearGradient>
              </Animated.View>
            </View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Veggie </Text>
              <AnimatedGo />
            </View>
            <Text style={styles.subtitle}>
              Find real-world vegetables with friends. Enter a room to start.
            </Text>
          </Animated.View>

          {/* ── How it works ── */}
          <View style={styles.howItWorksCard}>
            <StepRow number="1" text="See nearby vegetables appear on your map" fadeAnim={step1Anim} />
            <StepRow number="2" text="Walk within range to unlock the catch" fadeAnim={step2Anim} />
            <StepRow number="3" text="Use your camera to spot and catch it first" fadeAnim={step3Anim} />
          </View>

          {/* ── Error banner ── */}
          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* ── Form ── */}
          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: formAnim,
                transform: [
                  { translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
                ],
              },
            ]}
          >
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Your name</Text>
              <TextInput
                placeholder="Enter your name"
                placeholderTextColor="#4A5568"
                value={playerName}
                onChangeText={setPlayerName}
                onFocus={() => setFocusField('name')}
                onBlur={() => setFocusField(null)}
                maxLength={20}
                style={[styles.input, focusField === 'name' && styles.inputFocused]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Room code</Text>
                <TouchableOpacity onPress={handleQuickMatch} disabled={connecting}>
                  <Text style={styles.quickMatchLink}>Generate a new room</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                placeholder="Enter or generate a code"
                placeholderTextColor="#4A5568"
                value={roomCode}
                onChangeText={(t) => setRoomCode(t.toUpperCase())}
                onFocus={() => setFocusField('room')}
                onBlur={() => setFocusField(null)}
                maxLength={12}
                autoCapitalize="characters"
                style={[styles.input, focusField === 'room' && styles.inputFocused]}
              />
            </View>

            <Animated.View style={{ transform: [{ scale: joinPulse }] }}>
              <TouchableOpacity onPress={handleSubmit} disabled={!canSubmit} activeOpacity={0.85}>
                <LinearGradient
                  colors={canSubmit ? [GREEN, GREEN_LIGHT] : ['rgba(52,211,153,0.25)', 'rgba(52,211,153,0.18)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.joinButton}
                >
                  {connecting ? (
                    <ActivityIndicator size="small" color="#04140F" />
                  ) : (
                    <Text style={styles.joinButtonText}>Join game</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* ── Legal footer ── */}
          <Text style={styles.footNotice}>
            By continuing, you agree to Veggie Go's{' '}
            <Text onPress={() => setShowTerms(true)} style={styles.footLink}>Terms</Text>
            {' '}and{' '}
            <Text onPress={() => setShowPrivacy(true)} style={styles.footLink}>Privacy Policy</Text>,
            {' '}including location and camera use during gameplay.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 280 },

  scrollContent: { padding: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 40 },

  header: { alignItems: 'center', marginBottom: 28 },
  logoRing: {
    width: 72, height: 72, borderRadius: 20,
    borderWidth: 1.5, borderColor: 'rgba(52,211,153,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  logoBadge: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  logoBadgeText: { color: '#04140F', fontWeight: '700', fontSize: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  title: { color: INK, fontSize: 28, fontWeight: '700' },
  goAccent: { color: GREEN, fontSize: 28, fontWeight: '800' },
  subtitle: { color: MUTED, fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 280 },

  howItWorksCard: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    gap: 14,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBadge: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBadgeText: { color: GREEN, fontWeight: '700', fontSize: 12 },
  stepText: { color: INK, fontSize: 13.5, flex: 1, lineHeight: 19 },

  errorBanner: {
    backgroundColor: 'rgba(255,90,90,0.1)',
    borderWidth: 1,
    borderColor: ERROR_RED,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: ERROR_RED, fontSize: 13, fontWeight: '600', textAlign: 'center' },

  formCard: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 20,
    gap: 18,
  },
  fieldGroup: { gap: 8 },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { color: MUTED, fontSize: 12, fontWeight: '600' },
  quickMatchLink: { color: GREEN, fontSize: 12, fontWeight: '600' },
  input: {
    backgroundColor: '#080B10',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    color: INK,
    fontSize: 15,
  },
  inputFocused: { borderColor: GREEN },

  joinButton: {
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  joinButtonText: { color: '#04140F', fontWeight: '700', fontSize: 15 },

  footNotice: { color: '#4A5568', fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: 24 },
  footLink: { color: MUTED, textDecorationLine: 'underline', fontWeight: '600' },
});