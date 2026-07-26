import { NativeModules, Platform } from 'react-native';
import * as Location from 'expo-location';

const { GeospatialModule } = NativeModules;

/**
 * Unified location getter: tries ARCore/ARKit Geospatial pose first
 * (sub-meter accuracy, real-world heading), falls back to plain GPS
 * (expo-location) when Geospatial isn't tracking — e.g. indoors, no
 * VPS coverage in this area, or the native module isn't attached yet.
 *
 * Returns: { latitude, longitude, heading, accuracy, source }
 * where source is 'geospatial' or 'gps'.
 */
export async function getPlayerPosition() {
  if (GeospatialModule) {
    try {
      const supported = await GeospatialModule.isGeospatialSupported();
      if (supported) {
        const pose = await GeospatialModule.getGeospatialPose();
        return {
          latitude: pose.latitude,
          longitude: pose.longitude,
          heading: pose.heading,
          accuracy: pose.horizontalAccuracy,
          source: 'geospatial',
        };
      }
    } catch (err) {
      // Falls through to GPS below — this is expected indoors or
      // in areas without VPS coverage, not necessarily a bug.
      console.log('[GeospatialLocation] falling back to GPS:', err.message);
    }
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }
  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.BestForNavigation,
  });
  return {
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    heading: loc.coords.heading ?? 0,
    accuracy: loc.coords.accuracy ?? 20,
    source: 'gps',
  };
}
