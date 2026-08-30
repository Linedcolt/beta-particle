/**
 * Shared theme schema.
 *
 * This object is JSON.stringify'd and written into the App Group's shared
 * UserDefaults from the RN host app. The Swift keyboard extension reads the
 * same key at runtime and maps these fields onto a KeyboardKit
 * `KeyboardStyleService` / `KeyboardStyle`.
 *
 * Keep this file the single source of truth for the shape of a theme -
 * update it first, then update KeyboardViewController.swift's ThemeModel
 * to match field-for-field.
 */
export interface KeyboardTheme {
  /** Unique id so multiple saved themes can be listed later. */
  id: string;
  name: string;

  /** Hex colors, e.g. "#1C1C1E". Keep everything as hex strings for easy
   * transport - Swift side parses these into UIColor. */
  colors: {
    background: string;
    keyBackground: string;
    keyBackgroundPressed: string;
    keyText: string;
    specialKeyBackground: string;
    accent: string;
  };

  layout: {
    /** 0 = square corners, 1 = fully rounded (pill) keys */
    keyCornerRadius: number;
    keyboardHeight: "compact" | "regular" | "tall";
  };

  /** Whether key presses trigger haptic feedback. */
  hapticsEnabled: boolean;

  /** Whether key presses trigger the system click sound. */
  soundEnabled: boolean;
}
