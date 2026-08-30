import { KeyboardTheme } from "./types";

/**
 * Faithful-to-stock default. This is what the keyboard extension falls back
 * to if no theme has been saved yet (first launch, or App Group read
 * failure), so it should always look like Apple's own keyboard.
 */
export const DEFAULT_THEME: KeyboardTheme = {
  id: "default",
  name: "iOS Default",
  colors: {
    background: "#D1D3D9",
    keyBackground: "#FFFFFF",
    keyBackgroundPressed: "#B0B3B9",
    keyText: "#000000",
    specialKeyBackground: "#ADB0B8",
    accent: "#007AFF",
  },
  layout: {
    keyCornerRadius: 0.2,
    keyboardHeight: "regular",
  },
  hapticsEnabled: true,
  soundEnabled: true,
};
