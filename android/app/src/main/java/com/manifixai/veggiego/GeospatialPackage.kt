package com.veggiego.geospatial

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class GeospatialPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(GeospatialModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}

// Register this package in your MainApplication.kt's getPackages() list:
//
//   override fun getPackages(): List<ReactPackage> =
//       PackageList(this).packages.apply { add(GeospatialPackage()) }
