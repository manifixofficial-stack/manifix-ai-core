package com.manifixai.veggiego

import android.app.Application
import android.content.res.Configuration
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

// ViroReact — auto-linked by @reactvision/react-viro's Expo config
// plugin (see app.json "plugins"). Import path is the package's real
// namespace, not this app's package.
import com.viromedia.bridge.ReactViroPackage

// Custom native module — NOT part of any npm package, so Expo's
// autolinking/prebuild can't generate this registration automatically.
// This import + the packages.add() call below must be re-added by hand
// after every `npx expo prebuild --clean`, since prebuild only manages
// autolinked packages, not hand-written native modules like this one.
// FIX: this previously pointed at com.manifixai.veggiego.GeospatialPackage
// (this app's own package) — but GeospatialPackage.kt actually declares
// itself under com.veggiego.geospatial. That mismatch is what caused
// "Unresolved reference: GeospatialPackage" during compilation.
import com.veggiego.geospatial.GeospatialPackage

class MainApplication : Application(), ReactApplication {
  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
        this,
        object : DefaultReactNativeHost(this) {
          override fun getPackages(): List<ReactPackage> {
            val packages = PackageList(this).packages
            // Packages that cannot be autolinked yet can be added manually here, for example:
            // packages.add(new MyReactNativePackage());
            packages.add(ReactViroPackage(ReactViroPackage.ViroPlatform.AR))
            packages.add(ReactViroPackage(ReactViroPackage.ViroPlatform.GVR))
            packages.add(GeospatialPackage())
            return packages
          }
          override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"
          override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
          override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
          override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }
  )
  override val reactHost: ReactHost
    get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)
  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, OpenSourceMergedSoMapping)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }
  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
