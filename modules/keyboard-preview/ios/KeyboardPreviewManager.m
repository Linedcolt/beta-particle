#import <React/RCTViewManager.h>

// RCT_EXTERN_MODULE / RCT_EXPORT_VIEW_PROPERTY only exist as Objective-C
// macros, so this tiny shim is what actually registers the Swift
// KeyboardPreviewManager class with React Native. The macro looks the
// class up by name at runtime (NSClassFromString), so it doesn't need a
// bridging header or any compile-time link to KeyboardPreviewManager.swift.
//
// RCTViewManager subclasses are exposed to JS under their class name with
// a trailing "Manager" stripped, so `KeyboardPreviewManager` becomes the
// JS-visible native component name "KeyboardPreview" - see
// requireNativeComponent("KeyboardPreview") in index.tsx.
//
// Under React Native's New Architecture (Fabric), a plain RCTViewManager
// like this one is still picked up automatically through Fabric's
// "interop layer" for legacy (non-codegen'd) view managers - no extra
// Fabric-specific registration needed for a view this simple.
@interface RCT_EXTERN_MODULE(KeyboardPreviewManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(themeJSON, NSString)
RCT_EXPORT_VIEW_PROPERTY(layoutJSON, NSString)

@end