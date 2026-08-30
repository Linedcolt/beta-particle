import * as Keychain from "react-native-keychain";
import { KeyboardTheme } from "./types";
import { DEFAULT_THEME } from "./defaultTheme";

// --- Switched from App Groups to Keychain Sharing ---
//
// App Groups (com.apple.security.application-groups) turned out not to be
// actually shared between this app and the keyboard extension under
// AltStore/SideStore free-account sideloading - confirmed with a canary
// test (see git history for the old ExtensionStorage-based version).
//
// Keychain Sharing is a different mechanism: it doesn't require a
// capability to be registered server-side in the Apple Developer portal,
// just a matching "keychain-access-groups" entitlement on both targets
// (see app.json and targets/keyboard/expo-target.config.js), tied to your
// Team ID. That gives it a real chance of working where App Groups didn't.
//
// We deliberately do NOT pass an explicit `accessGroup` option below. Each
// target declares exactly ONE keychain-access-groups entry in its
// entitlements, and when there's only one, iOS uses it as the default
// automatically - so we never have to know or hardcode the literal,
// Team-ID-resolved group string (which we can't predict at build time,
// since this project archives unsigned and lets AltStore/SideStore do the
// real signing). Both sides just have to agree on that being the *only*
// group, which they do.

const THEME_SERVICE = "com.Linedcolt.kbappv2.theme";
const ACCOUNT = "value"; // constant; the Keychain API needs a username field, we don't use it

async function keychainSet(service: string, value: string): Promise<void> {
  await Keychain.setGenericPassword(ACCOUNT, value, { service });
}

async function keychainGet(service: string): Promise<string | null> {
  const result = await Keychain.getGenericPassword({ service });
  if (!result) return null;
  return result.password;
}

/** Persist a theme so the keyboard extension picks it up next time it's shown. */
export async function saveTheme(theme: KeyboardTheme): Promise<void> {
  await keychainSet(THEME_SERVICE, JSON.stringify(theme));
}

/** Read the last-saved theme back into the RN app (e.g. to prefill the editor). */
export async function loadTheme(): Promise<KeyboardTheme> {
  const raw = await keychainGet(THEME_SERVICE);
  if (!raw) return DEFAULT_THEME;
  try {
    return { ...DEFAULT_THEME, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_THEME;
  }
}
