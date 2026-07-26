// Required alongside GeospatialModule.swift — React Native's bridge needs
// this Obj-C file to expose the Swift class/methods to JS.
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(GeospatialModule, NSObject)

RCT_EXTERN_METHOD(getGeospatialPose:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(isGeospatialSupported:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
