import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { KeyboardTheme } from "../theme/types";
import { DEFAULT_THEME } from "../theme/defaultTheme";
import { saveTheme, loadTheme } from "../theme/themeStorage";

const HEIGHT_OPTIONS: KeyboardTheme["layout"]["keyboardHeight"][] = [
  "compact",
  "regular",
  "tall",
];

// Matches the height values a real KeyboardKit row renders at roughly
// closely enough for theme-checking purposes. If these ever look off next
// to a real device, adjust here - they don't feed into the extension.
const ROW_HEIGHT: Record<KeyboardTheme["layout"]["keyboardHeight"], number> = {
  compact: 34,
  regular: 42,
  tall: 50,
};

const CORNER_OPTIONS: { label: string; value: number }[] = [
  { label: "Square", value: 0 },
  { label: "Slight", value: 0.2 },
  { label: "Round", value: 0.5 },
  { label: "Pill", value: 1 },
];

const KEY_GAP = 5;

// --- Standard QWERTY layout, purely for previewing theme/layout values ---
// This intentionally mirrors the row shape KeyboardKit's standard iPhone
// layout renders (including row 2's half-key indent), so the preview's
// proportions read the same as the real keyboard. It is NOT the actual
// layout engine - once layouts become user-configurable (remapping, custom
// shapes), this needs to be swapped for whatever renders the real
// KeyboardLayoutConfig instead of this hardcoded shape.
type PreviewKey =
  | { id: string; label: string; flex: number; special: boolean }
  | { id: string; flex: number; spacer: true };

const letterRow = (letters: string[]): PreviewKey[] =>
  letters.map((l) => ({ id: l, label: l, flex: 1, special: false }));

const PREVIEW_ROWS: PreviewKey[][] = [
  letterRow(["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"]),
  [
    { id: "l-spacer", flex: 0.5, spacer: true },
    ...letterRow(["a", "s", "d", "f", "g", "h", "j", "k", "l"]),
    { id: "r-spacer", flex: 0.5, spacer: true },
  ],
  [
    { id: "shift", label: "⇧", flex: 1.5, special: true },
    ...letterRow(["z", "x", "c", "v", "b", "n", "m"]),
    { id: "backspace", label: "⌫", flex: 1.5, special: true },
  ],
  [
    { id: "123", label: "123", flex: 1.4, special: true },
    { id: "globe", label: "\u{1F310}", flex: 1, special: true },
    { id: "space", label: "space", flex: 5, special: true },
    { id: "return", label: "return", flex: 1.6, special: true },
  ],
];

export default function ThemeEditorScreen() {
  // Keychain access is async, so we can't load synchronously in useState
  // the way the old App-Group-backed version did. Start from the default
  // and swap in the real saved theme once it's loaded.
  const [theme, setTheme] = useState<KeyboardTheme>(DEFAULT_THEME);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  // Which preview key is currently held down, so the preview can show
  // keyBackgroundPressed the same way the extension does.
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  useEffect(() => {
    loadTheme().then(setTheme);
  }, []);

  const setColor = (key: keyof KeyboardTheme["colors"], value: string) =>
    setTheme((t) => ({ ...t, colors: { ...t.colors, [key]: value } }));

  const setCornerRadius = (value: number) =>
    setTheme((t) => ({ ...t, layout: { ...t.layout, keyCornerRadius: value } }));

  const handleSave = async () => {
    await saveTheme(theme);
    setSavedAt(new Date().toLocaleTimeString());
  };

  // Same formula as ThemedKeyboardStyleService.buttonStyle in
  // KeyboardViewController.swift (`CGFloat(theme.layout.keyCornerRadius) *
  // 20`). Keep these in sync - it's the whole point of this preview.
  const cornerRadius = theme.layout.keyCornerRadius * 20;
  const rowHeight = ROW_HEIGHT[theme.layout.keyboardHeight];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>Keyboard Theme Editor</Text>

      {/* --- Live preview ---
          Renders from the same theme fields and the same style formula the
          Swift extension uses (see ThemedKeyboardStyleService), and bleeds
          edge-to-edge like a real docked keyboard rather than sitting in a
          rounded card. Tap and hold any letter key to check
          keyBackgroundPressed - matching the extension, special keys
          (shift, backspace, 123, globe, space, return) intentionally do NOT
          change color when pressed, since ThemedKeyboardStyleService only
          swaps in keyBackgroundPressed for non-special actions today. */}
      <View
        style={[styles.previewWrap, { backgroundColor: theme.colors.background }]}
      >
        {PREVIEW_ROWS.map((row, i) => (
          <View
            key={i}
            style={[styles.previewRow, i > 0 && { marginTop: KEY_GAP }]}
          >
            {row.map((key) =>
              "spacer" in key ? (
                <View key={key.id} style={{ flex: key.flex }} />
              ) : (
                <Pressable
                  key={key.id}
                  onPressIn={() => setPressedKey(key.id)}
                  onPressOut={() =>
                    setPressedKey((k) => (k === key.id ? null : k))
                  }
                  style={[
                    styles.previewKey,
                    {
                      flex: key.flex,
                      height: rowHeight,
                      borderRadius: cornerRadius,
                      backgroundColor: key.special
                        ? theme.colors.specialKeyBackground
                        : pressedKey === key.id
                        ? theme.colors.keyBackgroundPressed
                        : theme.colors.keyBackground,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.previewKeyText,
                      { color: theme.colors.keyText },
                      key.label.length > 2 && styles.previewKeyTextSmall,
                    ]}
                    numberOfLines={1}
                  >
                    {key.label}
                  </Text>
                </Pressable>
              )
            )}
          </View>
        ))}
      </View>

      {/* --- Color fields --- */}
      {(Object.keys(theme.colors) as Array<keyof KeyboardTheme["colors"]>).map(
        (key) => (
          <View style={styles.row} key={key}>
            <Text style={styles.label}>{key}</Text>
            <TextInput
              style={styles.input}
              value={theme.colors[key]}
              autoCapitalize="none"
              onChangeText={(v) => setColor(key, v)}
              placeholder="#RRGGBB"
            />
          </View>
        )
      )}

      {/* --- Layout --- */}
      <Text style={styles.h2}>Keyboard height</Text>
      <View style={styles.segmented}>
        {HEIGHT_OPTIONS.map((opt) => (
          <Pressable
            key={opt}
            onPress={() =>
              setTheme((t) => ({
                ...t,
                layout: { ...t.layout, keyboardHeight: opt },
              }))
            }
            style={[
              styles.segment,
              theme.layout.keyboardHeight === opt && styles.segmentActive,
            ]}
          >
            <Text>{opt}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.h2}>Corner style</Text>
      <View style={styles.segmented}>
        {CORNER_OPTIONS.map((opt) => (
          <Pressable
            key={opt.label}
            onPress={() => setCornerRadius(opt.value)}
            style={[
              styles.segment,
              theme.layout.keyCornerRadius === opt.value && styles.segmentActive,
            ]}
          >
            <Text>{opt.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Haptics</Text>
        <Switch
          value={theme.hapticsEnabled}
          onValueChange={(v) => setTheme((t) => ({ ...t, hapticsEnabled: v }))}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Key sounds</Text>
        <Switch
          value={theme.soundEnabled}
          onValueChange={(v) => setTheme((t) => ({ ...t, soundEnabled: v }))}
        />
      </View>

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save theme</Text>
      </Pressable>
      {savedAt && <Text style={styles.savedNote}>Saved at {savedAt}</Text>}
      <Text style={styles.hint}>
        After saving, close and reopen the keyboard (switch apps or dismiss the
        keyboard and tap back into a text field) to see the new theme applied.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, gap: 4 },
  h1: { fontSize: 22, fontWeight: "700", marginBottom: 16 },
  h2: { fontSize: 16, fontWeight: "600", marginTop: 16, marginBottom: 8 },
  // Bleeds past the ScrollView's own 20pt padding on both sides so the
  // preview reaches the actual screen edges, like a docked keyboard does -
  // rather than floating as a rounded card, which was misleading about how
  // the background color actually reads in practice.
  previewWrap: {
    marginHorizontal: -20,
    paddingHorizontal: 3,
    paddingTop: 8,
    paddingBottom: 6,
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: "row",
  },
  previewKey: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: KEY_GAP / 2,
  },
  previewKeyText: {
    fontSize: 15,
  },
  previewKeyTextSmall: {
    fontSize: 11,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  label: { fontSize: 15, textTransform: "capitalize" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    width: 120,
    textAlign: "right",
  },
  segmented: { flexDirection: "row", gap: 8, marginBottom: 8 },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  segmentActive: { backgroundColor: "#007AFF33" },
  saveButton: {
    marginTop: 24,
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: { color: "white", fontWeight: "600", fontSize: 16 },
  savedNote: { textAlign: "center", marginTop: 8, color: "#666" },
  hint: { marginTop: 16, color: "#888", fontSize: 12, lineHeight: 18 },
});
