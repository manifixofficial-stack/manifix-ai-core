package com.veggiego.geospatial

import android.util.Log
import com.facebook.react.bridge.*
import com.google.ar.core.Earth
import com.google.ar.core.Session
import com.google.ar.core.Config
import com.google.ar.core.exceptions.*

/**
 * Bridges ARCore's Geospatial API (Earth-anchored lat/lng/altitude + heading)
 * to JavaScript. Replaces plain expo-location for outdoor mode when available.
 *
 * IMPORTANT: This module expects an ARCore Session to already be running
 * inside your AR view (GameCanvas native side). If you don't have an ARCore
 * Session yet, this module can't produce Geospatial poses — plain GPS
 * (expo-location) is still your fallback and should stay wired up in JS.
 */
class GeospatialModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var session: Session? = null

    override fun getName(): String = "GeospatialModule"

    /**
     * Call this once you have an active ARCore Session reference from your
     * AR view. In a typical Expo/RN + native AR setup, the Session is created
     * in your ARFragment/ARView native code and passed here via a shared
     * singleton or event — wiring that handoff is project-specific, so this
     * is left as a clear seam rather than guessed at.
     */
    fun attachSession(activeSession: Session) {
        session = activeSession
        try {
            val config = session!!.config
            config.geospatialMode = Config.GeospatialMode.ENABLED
            session!!.configure(config)
        } catch (e: Exception) {
            Log.e("GeospatialModule", "Failed to enable Geospatial mode", e)
        }
    }

    @ReactMethod
    fun getGeospatialPose(promise: Promise) {
        val currentSession = session
        if (currentSession == null) {
            promise.reject("NO_SESSION", "No active ARCore session attached yet")
            return
        }

        try {
            val earth: Earth? = currentSession.earth
            if (earth == null || earth.trackingState != com.google.ar.core.TrackingState.TRACKING) {
                promise.reject("NOT_TRACKING", "Earth tracking not yet available (indoors or no VPS coverage)")
                return
            }

            val pose = earth.cameraGeospatialPose
            val result = Arguments.createMap().apply {
                putDouble("latitude", pose.latitude)
                putDouble("longitude", pose.longitude)
                putDouble("altitude", pose.altitude)
                putDouble("heading", pose.heading)
                putDouble("horizontalAccuracy", pose.horizontalAccuracy)
                putDouble("headingAccuracy", pose.headingAccuracy)
            }
            promise.resolve(result)
        } catch (e: SessionPausedException) {
            promise.reject("SESSION_PAUSED", e.message)
        } catch (e: Exception) {
            promise.reject("GEOSPATIAL_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun isGeospatialSupported(promise: Promise) {
        val currentSession = session
        if (currentSession == null) {
            promise.resolve(false)
            return
        }
        try {
            val availability = currentSession.isGeospatialModeSupported(Config.GeospatialMode.ENABLED)
            promise.resolve(availability)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }
}
