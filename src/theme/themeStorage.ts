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
