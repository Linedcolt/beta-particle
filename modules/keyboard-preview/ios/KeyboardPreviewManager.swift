import UIKit
import React

// NOTE ON WHY THIS ISN'T AN EXPO MODULE
// --------------------------------------
// This used to be built as a local Expo Module (an ExpoModulesCore
// `Module { View(...) }` definition, autolinked as its own CocoaPods pod).
// That never actually worked: the module had no .podspec, so
// `pod install` never created a "KeyboardPreview" pod at all, and
// `requireNativeViewManager("KeyboardPreview")` had nothing to find at
// runtime (-> "Unimplemented component" in the app).
//
// Adding the missing podspec wouldn't have been enough on its own, either.
// KeyboardKit is linked as a Swift Package Manager dependency directly on
// the `kbapp` and `keyboard` Xcode targets (see scripts/add_swift_packages.rb) -
// it is NOT a CocoaPods dependency. A separately-compiled CocoaPods pod
// lives in its own Pods.xcodeproj and has no visibility into SPM packages
// that were linked onto a target in the *app's* .xcodeproj, so
// `import KeyboardKit` inside a "KeyboardPreview" pod would fail to
// compile even with a correct podspec.
//
// So instead, these files are compiled directly into the main `kbapp`
// target (same place KeyboardKit is already linked), via
// scripts/add_swift_packages.rb, which now also wires this group into the
// target's Sources build phase after `expo prebuild` regenerates ios/.
// That sidesteps Expo Modules autolinking entirely and uses React Native's
// plain RCTViewManager bridge instead, which any compiled-in class can
// register regardless of which target/pod built it. See
// KeyboardPreviewManager.m for the Objective-C side of that registration
// (RCT_EXTERN_MODULE has no Swift equivalent).
@objc(KeyboardPreviewManager)
class KeyboardPreviewManager: RCTViewManager {
    override static func requiresMainQueueSetup() -> Bool {
        true
    }

    override func view() -> UIView! {
        KeyboardPreviewView()
    }
}
