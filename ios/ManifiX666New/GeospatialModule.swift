import Foundation
import ARKit
// import ARCoreGeospatial  // from the ARCore/Geospatial pod (Step E)

/// Bridges ARCore's Geospatial API to JS on iOS.
/// Requires an active GARSession (from ARCore-iOS-SDK) layered on top of
/// your ARKit session — that handoff happens in your AR view controller,
/// not here. This module exposes the resulting pose to JS.
@objc(GeospatialModule)
class GeospatialModule: NSObject {

  // Set this from your AR view controller once GARSession is running.
  // var garSession: GARSession?

  @objc
  func getGeospatialPose(_ resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
    // Placeholder wiring — fill in once GARSession is attached from your
    // AR view controller. Structure mirrors the Android module so JS-side
    // code is identical across platforms.
    //
    // guard let session = garSession, let earth = session.earth,
    //       earth.earthState == .enabled,
    //       earth.trackingState == .tracking else {
    //   reject("NOT_TRACKING", "Earth tracking not yet available", nil)
    //   return
    // }
    // let pose = earth.cameraGeospatialTransform
    // resolve([
    //   "latitude": pose.coordinate.latitude,
    //   "longitude": pose.coordinate.longitude,
    //   "altitude": pose.altitude,
    //   "heading": pose.heading,
    //   "horizontalAccuracy": pose.horizontalAccuracy,
    //   "headingAccuracy": pose.headingAccuracy
    // ])

    reject("NOT_IMPLEMENTED", "Attach a GARSession before calling this — see comment block above", nil)
  }

  @objc
  func isGeospatialSupported(_ resolve: @escaping RCTPromiseResolveBlock,
                              rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve(false) // flip once GARSession wiring above is complete
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
