import { ExtensionStorage } from "@bacons/apple-targets";
import { KeyboardTheme } from "./types";
import { DEFAULT_THEME } from "./defaultTheme";

// Must exactly match:
//  - app.json -> expo.ios.entitlements["com.apple.security.application-groups"][0]
//  - targets/keyboard/expo-target.config.js entitlements mirror
export const APP_GROUP = "group.com.Linedcolt.kbappv2";

const THEME_KEY = "activeTheme";

const storage = new ExtensionStorage(APP_GROUP);

/** Persist a theme so the keyboard extension picks it up next time it's shown. */
export function saveTheme(theme: KeyboardTheme): void {
  storage.set(THEME_KEY, JSON.stringify(theme));
}

/** Read the last-saved theme back into the RN app (e.g. to prefill the editor). */
export function loadTheme(): KeyboardTheme {
  const raw = storage.get(THEME_KEY);
  if (!raw) return DEFAULT_THEME;
  try {
    return { ...DEFAULT_THEME, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_THEME;
  }
}

// MARK: - App Group diagnostic (temporary)
//
// Proves, independent of the theme JSON, whether the app and the keyboard
// extension are actually sharing the same UserDefaults container.
//
//  - APP writes CANARY_FROM_APP_KEY with a timestamp.
//  - KEYBOARD (Swift) writes CANARY_FROM_KEYBOARD_KEY with a timestamp on
//    every time it's shown, and displays whatever it reads under
//    CANARY_FROM_APP_KEY in its debug banner.
//  - The app reads CANARY_FROM_KEYBOARD_KEY back to see the reverse
//    direction.
//
// If the app can write a canary but the keyboard's banner never shows it
// (and/or the app never sees the keyboard's canary), the two processes are
// not sharing a real container - this points at the AltStore/SideStore
// re-signing step, not a bug in this JS/Swift code.
const CANARY_FROM_APP_KEY = "canaryFromApp";
const CANARY_FROM_KEYBOARD_KEY = "canaryFromKeyboard";

/** Call from the RN app to write a fresh canary; returns the stamp written. */
export function writeAppCanary(): string {
  const stamp = new Date().toISOString();
  storage.set(CANARY_FROM_APP_KEY, stamp);
  return stamp;
}

/** Call from the RN app to see the last canary the keyboard extension wrote. */
export function readKeyboardCanary(): string | null {
  return storage.get(CANARY_FROM_KEYBOARD_KEY);
}
