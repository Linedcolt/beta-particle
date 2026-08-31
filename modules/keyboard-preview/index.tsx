import * as React from "react";
import { requireNativeComponent } from "react-native";
import type { ViewProps } from "react-native";

export type KeyboardPreviewViewProps = ViewProps & {
  /**
   * JSON.stringify(theme) - decoded on the native side into the same
   * KeyboardThemeModel struct the extension uses. See src/theme/types.ts.
   */
  themeJSON: string;
  /**
   * JSON.stringify(layoutConfig) - decoded on the native side into the
   * same KeyboardLayoutConfig struct the extension uses. See
   * src/theme/layoutTypes.ts. Optional - omit or pass "{}" for no
   * overrides.
   */
  layoutJSON?: string;
};

// This is a plain RCTViewManager-backed native component (registered in
// modules/keyboard-preview/ios/KeyboardPreviewManager.m), not an Expo
// Modules view - see the big comment in KeyboardPreviewManager.swift for
// why. requireNativeComponent looks up the class by the JS-visible name
// RCTViewManager derives from KeyboardPreviewManager (drops the "Manager"
// suffix), which is why this string is "KeyboardPreview".
const NativeKeyboardPreviewView =
  requireNativeComponent<KeyboardPreviewViewProps>("KeyboardPreview");

/**
 * Renders the ACTUAL KeyboardKit KeyboardView (same Swift code path as the
 * keyboard extension, same ThemedKeyboardStyleService) inside the RN app,
 * via a native UIHostingController bridge - not a hand-rolled JS
 * recreation. See modules/keyboard-preview/ios for how.
 *
 * Give it an explicit `style.height` - see PREVIEW_HEIGHT in
 * ThemeEditorScreen.tsx. That number is currently an approximation (the one
 * remaining hand-guessed value in this whole pipeline); everything drawn
 * inside that box comes straight from KeyboardKit's own layout math.
 */
export default function KeyboardPreviewView(props: KeyboardPreviewViewProps) {
  return <NativeKeyboardPreviewView {...props} />;
}