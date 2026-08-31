import * as React from "react";
import { requireNativeViewManager } from "expo-modules-core";
import type { ViewProps } from "react-native";

export type KeyboardPreviewViewProps = ViewProps & {
  /**
   * JSON.stringify(theme) - decoded on the native side into the same
   * KeyboardThemeModel struct the extension uses. See src/theme/types.ts.
   */
  themeJSON: string;
};

const NativeKeyboardPreviewView =
  requireNativeViewManager<KeyboardPreviewViewProps>("KeyboardPreview");

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
