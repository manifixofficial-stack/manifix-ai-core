// src/components/Scoreboard.jsx
// React Native rewrite: framer-motion (web-only) replaced with RN's
// Animated API. Also fixed a prop-contract mismatch — App.js calls this
// as <Scoreboard players={playersMap} mySlot={...} leaderboard={...} />,
// where playersMap is keyed by SLOT id (see App.js's playersMap useMemo),
// not by socket/player id, and identity is `mySlot`, not `currentUsername`.
// This version matches that real call site.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

const DETHRONE_FLASH_MS = 2200;
const BLAST_JIGGLE_MS = 650;

const FALLBACK_PALETTE = ['#39ff88', '#ffffff', '#4a90ff', '#1b3a6b', '#7fffb0', '#8fb8ff'];

function hashColor(seed) {
  const str = String(seed || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length];
}

function rankBadge(index) {
  if (index === 0) return '👑';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `#${index + 1}`;
}

// One leaderboard row. Handles its own dethrone-flash + score-blast +
// fill-bar animations via RN's Animated API.
function ScoreRow({ player, index, isMe, isCrowned, maxScore }) {
  const prevScoreRef = useRef(player.score);
  const [isDethroned, setIsDethroned] = useState(false);
  const [isBlasting, setIsBlasting] = useState(false);
  const wasCrownedRef = useRef(isCrowned);

  const fillAnim = useRef(new Animated.Value(0)).current;
  const blastAnim = useRef(new Animated.Value(1)).current;
  const dethroneAnim = useRef(new Animated.Value(0)).current;
  const crownGlowAnim = useRef(new Animated.Value(0)).current;

  const fillPct = Math.max(6, Math.min(100, (player.score / (maxScore || 1)) * 100));

  useEffect(() => {
    Animated.spring(fillAnim, {
      toValue: fillPct,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [fillPct]);

  // Dethroned: was crowned last render, isn't now.
  useEffect(() => {
    if (wasCrownedRef.current && !isCrowned) {
      setIsDethroned(true);
      dethroneAnim.setValue(0);
      Animated.sequence([
        Animated.timing(dethroneAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dethroneAnim, { toValue: 0.55, duration: 400, useNativeDriver: true }),
        Animated.timing(dethroneAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(dethroneAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start(() => setIsDethroned(false));
    }
    wasCrownedRef.current = isCrowned;
  }, [isCrowned]);

  // Score blast: points went up since last render.
  useEffect(() => {
    if (player.score > prevScoreRef.current) {
      setIsBlasting(true);
      blastAnim.setValue(1.4);
      Animated.spring(blastAnim, { toValue: 1, useNativeDriver: true, friction: 5 }).start(() =>
        setIsBlasting(false)
      );
    }
    prevScoreRef.current = player.score;
  }, [player.score]);

  useEffect(() => {
    if (!isCrowned) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(crownGlowAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(crownGlowAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isCrowned]);

  return (
    <View
      style={[
        styles.row,
        isMe ? styles.rowMe : styles.rowOther,
        isCrowned && { borderColor: '#7fffb0' },
      ]}
    >
      {isCrowned && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.crownRing,
            {
              opacity: crownGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
            },
          ]}
        />
      )}

      {isDethroned && (
        <Animated.View
          pointerEvents="none"
          style={[styles.dethroneOverlay, { opacity: dethroneAnim }]}
        >
          <Text style={styles.dethroneText}>DETHRONED!</Text>
        </Animated.View>
      )}

      <Animated.View style={{ transform: [{ scale: blastAnim }] }}>
        <View style={styles.rowTop}>
          <View style={styles.rowLeft}>
            <Text style={styles.rankBadge}>{rankBadge(index)}</Text>
            <View style={[styles.colorDot, { backgroundColor: player.color }]} />
            <Text style={[styles.username, isMe && styles.usernameMe]} numberOfLines={1}>
              {player.username}
              {isMe ? ' (You)' : ''}
            </Text>
            {isCrowned && <Text style={styles.crownLabel}>CROWN MASTER</Text>}
          </View>
          <Text style={[styles.scoreText, isBlasting && styles.scoreTextBlast]}>
            {player.score}
          </Text>
        </View>

        <View style={styles.barTrack}>
          <Animated.View
            style={[
              styles.barFill,
              {
                width: fillAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
              },
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );
}

// players: keyed by slotId (see App.js playersMap), e.g.
//   { SLOT_01: { slotId, name, score, character }, ... }
// mySlot: the local player's own slot id, used to highlight "You".
export default function Scoreboard({ players = {}, mySlot = null }) {
  const ranked = useMemo(() => {
    return Object.entries(players || {})
      .map(([slotId, p]) => {
        const username = p?.name || 'EXPLORER';
        return {
          playerId: slotId,
          username,
          score: p?.score ?? 0,
          color: p?.color || hashColor(username || slotId),
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [players]);

  const maxScore = ranked[0]?.score || 1;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>LEADERBOARD</Text>

      {ranked.map((player, index) => (
        <ScoreRow
          key={player.playerId}
          player={player}
          index={index}
          isMe={mySlot != null && player.playerId === mySlot}
          isCrowned={index === 0}
          maxScore={maxScore}
        />
      ))}

      {ranked.length === 0 && (
        <Text style={styles.emptyText}>CONNECTING TO TOURNAMENT CHANNELS...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(6, 10, 18, 0.9)',
    borderWidth: 1,
    borderColor: '#1b3a6b',
    borderRadius: 14,
    padding: 14,
    width: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#39ff88',
    marginBottom: 10,
    textAlign: 'center',
  },
  row: {
    position: 'relative',
    flexDirection: 'column',
    gap: 4,
    padding: 8,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  rowMe: {
    backgroundColor: 'rgba(57, 255, 136, 0.10)',
    borderColor: '#39ff88',
  },
  rowOther: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  crownRing: {
    ...StyleSheet.absoluteFillObject,
    margin: -2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#7fffb0',
  },
  dethroneOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ff2b4d',
    backgroundColor: 'rgba(255,43,77,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  dethroneText: {
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1.5,
    color: '#ff2b4d',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  rankBadge: {
    fontSize: 14,
    width: 26,
    textAlign: 'center',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  username: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    flexShrink: 1,
  },
  usernameMe: {
    fontWeight: '600',
  },
  crownLabel: {
    marginLeft: 6,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#7fffb0',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#39ff88',
  },
  scoreTextBlast: {
    color: '#39ff6a',
  },
  barTrack: {
    width: '100%',
    height: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    marginTop: 4,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#39ff88',
  },
  emptyText: {
    color: '#8a8a93',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 8,
  },
});