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
import KeyboardPreviewView from "../../modules/keyboard-preview";

const HEIGHT_OPTIONS: KeyboardTheme["layout"]["keyboardHeight"][] = [
  "compact",
  "regular",
  "tall",
];

const CORNER_OPTIONS: { label: string; value: number }[] = [
  { label: "Square", value: 0 },
  { label: "Slight", value: 0.2 },
  { label: "Round", value: 0.5 },
  { label: "Pill", value: 1 },
];

// This is now the ONE hand-guessed number left in the whole preview
// pipeline - everything drawn inside this box comes straight from
// KeyboardKit's real layout math (see modules/keyboard-preview), but RN's
// Yoga layout still needs an explicit height for the native view, and
// KeyboardKit doesn't report its intrinsic size back across the bridge
// (yet). If the preview looks clipped or floaty on your device, adjust
// these - they don't affect anything the extension actually renders with.
const PREVIEW_HEIGHT: Record<KeyboardTheme["layout"]["keyboardHeight"], number> = {
  compact: 220,
  regular: 260,
  tall: 300,
};

export default function ThemeEditorScreen() {
  // Keychain access is async, so we can't load synchronously in useState
  // the way the old App-Group-backed version did. Start from the default
  // and swap in the real saved theme once it's loaded.
  const [theme, setTheme] = useState<KeyboardTheme>(DEFAULT_THEME);
  const [savedAt, setSavedAt] = useState<string | null>(null);

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>Keyboard Theme Editor</Text>

      {/* --- Live preview ---
          This is the REAL KeyboardView (same Swift code path, same
          ThemedKeyboardStyleService as the extension), rendered through a
          native UIHostingController bridge - not a JS recreation. See
          modules/keyboard-preview. Tap/hold keys to check
          keyBackgroundPressed the same way the extension applies it. */}
      <KeyboardPreviewView
        themeJSON={JSON.stringify(theme)}
        style={[
          styles.previewWrap,
          { height: PREVIEW_HEIGHT[theme.layout.keyboardHeight] },
        ]}
      />

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
  // preview reaches the actual screen edges, like a docked keyboard does.
  previewWrap: {
    marginHorizontal: -20,
    marginBottom: 8,
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
