package com.manifixai.veggiego.ar

// ============================================================
// STATUS: UNTESTED DRAFT. Never compiled, never run on a device.
// Structural starting point for a native Android developer to build
// from in Android Studio — not verified working code. Treat every
// ARCore call below as "should be roughly right" rather than
// "confirmed correct" — I cannot compile Kotlin, launch Android
// Studio, or test on a physical Android device from this chat.
// ============================================================
//
// Implements the same contract as the iOS Swift skeleton
// (ios/VeggieGoARPlugin.swift) so arBridge.js's JS-side code is
// identical regardless of platform:
//   startSession()               -> { success: Boolean }
//   stopSession()                -> void
//   registerAnchor(vegId, x, y)  -> { y: Double } | null
//   events: groundPlaneUpdate, occlusionUpdate, sessionError
//
// SETUP NEEDED BEYOND THIS FILE (Android Studio project, not code):
//   - AndroidManifest.xml: CAMERA permission + ARCore <meta-data>
//     required-vs-optional declaration (see capacitor.config.json's
//     android._comment_arcore note)
//   - build.gradle: implementation 'com.google.ar:core:<latest>'
//   - minSdkVersion 24+ for ARCore
//   - Register this plugin's class with Capacitor's plugin bridge
//     (MainActivity.java/kt: registerPlugin(VeggieGoARPlugin::class.java))
//
// KNOWN GAP — OCCLUSION DEVICE SUPPORT:
// ARCore's Depth API (Frame.acquireDepthImage16Bits()) requires
// Config.DepthMode.AUTOMATIC support, which is NOT universal across
// all ARCore-certified devices (depends on chipset/sensors — some
// devices support only software-estimated depth, others none at all).
// This draft checks session.isDepthModeSupported() before enabling it
// and simply never fires occlusionUpdate if unsupported — same safe
// fallback behavior as the iOS non-LiDAR case.

import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.ar.core.Config
import com.google.ar.core.Frame
import com.google.ar.core.Plane
import com.google.ar.core.Session
import com.google.ar.core.TrackingState
import com.google.ar.core.exceptions.UnavailableException

@CapacitorPlugin(name = "VeggieGoAR")
class VeggieGoARPlugin : Plugin() {

    private var arSession: Session? = null
    private var groundPlaneY: Float? = null
    private val trackedVegIds: MutableMap<String, Pair<Float, Float>> = mutableMapOf() // vegId -> normalized (x, y)

    // MARK: - startSession

    @PluginMethod
    fun startSession(call: PluginCall) {
        try {
            val session = Session(context)
            val config = Config(session)
            config.planeFindingMode = Config.PlaneFindingMode.HORIZONTAL

            // Depth (occlusion) — device-dependent, see file-header note.
            if (session.isDepthModeSupported(Config.DepthMode.AUTOMATIC)) {
                config.depthMode = Config.DepthMode.AUTOMATIC
            }

            session.configure(config)
            session.resume()
            arSession = session

            val result = JSObject()
            result.put("success", true)
            call.resolve(result)
        } catch (e: UnavailableException) {
            Log.w("VeggieGoAR", "ARCore unavailable on this device: ${e.message}")
            val result = JSObject()
            result.put("success", false)
            call.resolve(result)
        } catch (e: Exception) {
            Log.e("VeggieGoAR", "startSession failed: ${e.message}")
            val result = JSObject()
            result.put("success", false)
            call.resolve(result)
        }
    }

    // MARK: - stopSession

    @PluginMethod
    fun stopSession(call: PluginCall) {
        arSession?.pause()
        arSession?.close()
        arSession = null
        groundPlaneY = null
        trackedVegIds.clear()
        call.resolve()
    }

    // MARK: - registerAnchor
    //
    // Same integration gap as the iOS draft: ARCore's hitTest needs a
    // live Frame from an active GLSurfaceView/SurfaceView render loop.
    // Wiring that surface in alongside (or in place of) GameCanvas.jsx's
    // current plain <video> background is separate native/hybrid-app
    // work not resolved by this file alone — see the bottom-of-file note.

    @PluginMethod
    fun registerAnchor(call: PluginCall) {
        val vegId = call.getString("vegId")
        val screenX = call.getDouble("screenX")
        val screenY = call.getDouble("screenY")
        val session = arSession

        if (vegId == null || screenX == null || screenY == null || session == null) {
            call.resolve()
            return
        }

        try {
            // NOTE: session.update() must be called from the AR render
            // thread with a live GL surface bound — calling it here
            // directly, off that thread, will not work as-is. This is
            // exactly the kind of on-device wiring detail a native dev
            // needs to fix once this is actually integrated into a real
            // render loop (e.g. Sceneform, or a raw GLSurfaceView).
            val frame: Frame = session.update()
            // ARCore's hitTest expects raw pixel coords relative to the
            // camera view — screenX/screenY arrive normalized (0-1) per
            // the arBridge.js contract, so a real implementation must
            // multiply by the actual surface view's width/height here.
            val hits = frame.hitTest(screenX.toFloat(), screenY.toFloat())
            val planeHit = hits.firstOrNull { hit ->
                val trackable = hit.trackable
                trackable is Plane && trackable.isPoseInPolygon(hit.hitPose) &&
                    trackable.trackingState == TrackingState.TRACKING
            }

            if (planeHit == null) {
                call.resolve()
                return
            }

            val worldY = planeHit.hitPose.ty().toDouble()
            trackedVegIds[vegId] = Pair(screenX.toFloat(), screenY.toFloat())

            val result = JSObject()
            result.put("y", worldY)
            call.resolve(result)
        } catch (e: Exception) {
            Log.e("VeggieGoAR", "registerAnchor failed: ${e.message}")
            call.resolve()
        }
    }

    // TODO (groundPlaneUpdate + occlusionUpdate) — NOT IMPLEMENTED IN
    // THIS DRAFT: unlike iOS's delegate-callback model, ARCore expects
    // the host app to poll session.update() once per render frame and
    // inspect the returned Frame/Plane list itself. A real
    // implementation needs a render-loop hook (Sceneform's
    // ArSceneView.scene.addOnUpdateListener{} is the common approach)
    // that, per frame:
    //   1. Walks session.getAllTrackables(Plane::class.java), finds the
    //      largest horizontal one, and calls notifyListeners(
    //      "groundPlaneUpdate", JSObject().put("y", ...)) when it
    //      changes — mirroring the iOS draft's handlePlaneAnchors().
    //   2. For each id in trackedVegIds, samples
    //      frame.acquireDepthImage16Bits() at that normalized screen
    //      point (if depth mode is active) and compares against the
    //      veggie's last known AR distance, emitting "occlusionUpdate"
    //      with { occluded: { vegId: Boolean } } on any change.
    // Left as a TODO for the same reason as the iOS draft: this needs
    // on-device tuning against real ARCore depth data that can't be
    // responsibly written blind.
}

// INTEGRATION GAP (read before wiring this in):
// Same as the iOS draft — GameCanvas.jsx's plain getUserMedia() video
// background and ARCore's expected GLSurfaceView/Sceneform render
// surface are two different camera pipelines. Reconciling them is real
// native/hybrid-app architecture work, not resolved by this file alone.
