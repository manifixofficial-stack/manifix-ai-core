/**
 * Splash.jsx
 components/Splash.jsx
 *
 * Rendered directly by App.js (outside the NavigationContainer) while
 * `booted` is false — i.e. while device UUID resolution + AsyncStorage
 * session restore are in flight. Takes no props and has no navigation
 * of its own; App.js swaps it out for the real stack once boot resolves.
 */

import React from 'react';
import { View, Image, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function Splash() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Veggie Go</Text>
      <ActivityIndicator size="large" color="#4CAF50" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  spinner: {
    marginTop: 8,
  },
});
