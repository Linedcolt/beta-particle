// Mirrors KeyboardLayoutConfig/KeyOverride in
// targets/keyboard/KeyboardLayoutConfig.swift and
// modules/keyboard-preview/ios/KeyboardLayoutConfig.swift. If you add a
// field here, add it in both of those too, in the same shape.
//
// Scope note: this only covers the three letter rows (top/home/bottom of a
// standard QWERTY layout) - not the bottom system row (space/return/globe/
// dictation), whose real composition varies by locale, orientation, and
// keyboard type in ways this first pass deliberately doesn't try to
// re-derive. See the big comment in RemappableLayoutService.swift.

export type KeyAction =
  | { type: "character"; value: string }
  | { type: "backspace" }
  | { type: "shift" };

export interface KeyOverride {
  /** Which letter row this targets: 0 = top, 1 = home, 2 = bottom. */
  row: 0 | 1 | 2;
  /**
   * Position among that row's real keys, left to right, 0-based. Counts
   * every actual key on the row (including shift/backspace on row 2), but
   * skips the invisible margin spacers KeyboardKit sometimes adds to
   * center a shorter row under a longer one - so this always lines up
   * with what you'd count by eye on the keyboard.
   */
  index: number;
  /** Omit to leave this key's action untouched and only change its width. */
  action?: KeyAction;
  /**
   * Multiplier on the key's normal width: 1.0 = standard size, 2.0 =
   * double width, 0.5 = half width. Omit to leave width untouched. Note
   * this changes how much space neighboring untouched keys get too, since
   * a row always fills its full width.
   */
  widthWeight?: number;
}

export interface KeyboardLayoutConfig {
  overrides: KeyOverride[];
}

export const DEFAULT_LAYOUT_CONFIG: KeyboardLayoutConfig = {
  overrides: [],
};

/** Human-readable label for a row index, for UI pickers. */
export const ROW_LABELS: Record<0 | 1 | 2, string> = {
  0: "Top row (q-p)",
  1: "Home row (a-l)",
  2: "Bottom row (shift-backspace)",
};
