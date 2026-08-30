import React, { useState } from "react";
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
import { saveTheme } from "../theme/themeStorage";

const HEIGHT_OPTIONS: KeyboardTheme["layout"]["keyboardHeight"][] = [
  "compact",
  "regular",
  "tall",
];

export default function ThemeEditorScreen() {
  const [theme, setTheme] = useState<KeyboardTheme>(DEFAULT_THEME);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const setColor = (key: keyof KeyboardTheme["colors"], value: string) =>
    setTheme((t) => ({ ...t, colors: { ...t.colors, [key]: value } }));

  const handleSave = () => {
    saveTheme(theme);
    setSavedAt(new Date().toLocaleTimeString());
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>Keyboard Theme Editor</Text>

      {/* --- Live preview, built from plain RN views, not the real extension --- */}
      <View
        style={[styles.previewKeyboard, { backgroundColor: theme.colors.background }]}
      >
        {["Q", "W", "E", "R", "T"].map((letter) => (
          <View
            key={letter}
            style={[
              styles.previewKey,
              {
                backgroundColor: theme.colors.keyBackground,
                borderRadius: 8 * theme.layout.keyCornerRadius * 5,
              },
            ]}
          >
            <Text style={{ color: theme.colors.keyText }}>{letter}</Text>
          </View>
        ))}
      </View>
      <View
        style={[
          styles.previewKey,
          styles.previewSpecialKey,
          { backgroundColor: theme.colors.specialKeyBackground },
        ]}
      >
        <Text style={{ color: theme.colors.keyText }}>⇧</Text>
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
  previewKeyboard: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  previewKey: {
    width: 36,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  previewSpecialKey: {
    width: 56,
    height: 44,
    alignSelf: "flex-start",
    borderRadius: 8,
    marginBottom: 16,
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
