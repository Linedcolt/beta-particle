import * as Keychain from "react-native-keychain";
import { KeyboardLayoutConfig, DEFAULT_LAYOUT_CONFIG } from "./layoutTypes";

// Same Keychain Sharing mechanism as themeStorage.ts - see the comment
// there for why. Deliberately a separate Keychain service (not bundled
// into the theme JSON) so layout and theme can be saved/loaded/reset
// independently.
const LAYOUT_SERVICE = "com.Linedcolt.kbappv2.layout";
const ACCOUNT = "value";

async function keychainSet(service: string, value: string): Promise<void> {
  await Keychain.setGenericPassword(ACCOUNT, value, { service });
}

async function keychainGet(service: string): Promise<string | null> {
  const result = await Keychain.getGenericPassword({ service });
  if (!result) return null;
  return result.password;
}

/** Persist layout overrides so the keyboard extension picks them up next time it's shown. */
export async function saveLayoutConfig(config: KeyboardLayoutConfig): Promise<void> {
  await keychainSet(LAYOUT_SERVICE, JSON.stringify(config));
}

/** Read the last-saved layout overrides back into the RN app (e.g. to prefill the editor). */
export async function loadLayoutConfig(): Promise<KeyboardLayoutConfig> {
  const raw = await keychainGet(LAYOUT_SERVICE);
  if (!raw) return DEFAULT_LAYOUT_CONFIG;
  try {
    return { ...DEFAULT_LAYOUT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_LAYOUT_CONFIG;
  }
}
