// src/components/ConnectionStatus.jsx — The Veggie GO Radar Network Badge
// React Native rewrite: replaces framer-motion (web-only, cannot run in RN)
// with RN's built-in Animated API. Same phase logic and visuals preserved.

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

// normalizePhase(): buckets every real tickStatus value into one of five
// badge states, so nothing new App.js starts sending later silently
// falls back to idle again without at least degrading sensibly.
function normalizePhase(raw) {
  switch (raw) {
    case 'connecting':
      return 'connecting';
    case 'joined':
    case 'connected':
      return 'connected';
    case 'disconnected':
      return 'disconnected';
    case 'failed':
    case 'error':
      return 'error';
    case 'idle':
    default:
      return 'idle';
  }
}

const PHASE_CONFIG = {
  idle: {
    label: 'SATELLITE SCANNING AREA…',
    sublabel: null,
    color: '#FFC93C',
    pulse: 'blink',
  },
  connecting: {
    label: 'LINKING TO ARENA SERVER…',
    sublabel: null,
    color: '#FFC93C',
    pulse: 'blink',
  },
  connected: {
    label: (roomCode) => `📡 LIVE — ARENA ${roomCode || 'SCANNING'}`,
    sublabel: 'Connected · Multiplayer sync active',
    color: '#39ff88',
    pulse: 'glow',
  },
  disconnected: {
    label: 'CONNECTION LOST — RECONNECTING…',
    sublabel: null,
    color: '#ff3333',
    pulse: 'blink',
  },
  error: {
    label: 'CONNECTION FAILED — CHECK NETWORK',
    sublabel: null,
    color: '#ff3333',
    pulse: 'blink',
  },
};

// phase is whatever App.js's tickStatus currently is — normalized below
// rather than requiring App.js to already speak this component's vocabulary.
function ConnectionStatus({ roomCode, phase }) {
  const bucket = normalizePhase(phase);
  const config = PHASE_CONFIG[bucket];
  const label = typeof config.label === 'function' ? config.label(roomCode) : config.label;
  const { sublabel, color, pulse } = config;

  // Entrance animation (replaces framer-motion's initial/animate fade+slide)
  const entranceAnim = useRef(new Animated.Value(0)).current;
  // Pulse animation (replaces framer-motion's infinite dot animation)
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    entranceAnim.setValue(0);
    Animated.timing(entranceAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [bucket]);

  useEffect(() => {
    pulseAnim.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: pulse === 'blink' ? 800 : 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: pulse === 'blink' ? 800 : 1500,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const dotOpacity =
    pulse === 'blink'
      ? pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] })
      : 1;
  const dotScale =
    pulse === 'glow'
      ? pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.25] })
      : 1;

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          borderColor: bucket === 'connected' ? color : 'rgba(255, 215, 0, 0.35)',
          opacity: entranceAnim,
          transform: [
            {
              translateY: entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }),
            },
          ],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: color,
            opacity: dotOpacity,
            transform: [{ scale: dotScale }],
          },
        ]}
      />
      <View style={styles.textCol}>
        <Text style={[styles.label, { color }]} numberOfLines={1}>
          {label}
        </Text>
        {sublabel && (
          <Text style={styles.sublabel} numberOfLines={1}>
            {sublabel}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(18, 16, 12, 0.85)',
    borderWidth: 2,
    borderRadius: 999,
    zIndex: 999,
    maxWidth: '90%',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  textCol: {
    flexDirection: 'column',
  },
  label: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sublabel: {
    color: '#F5F0E8',
    opacity: 0.7,
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});

export default ConnectionStatus;