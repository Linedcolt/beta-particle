import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Animated,
} from "react-native";
import { KeyboardTheme } from "../theme/types";
import { DEFAULT_THEME } from "../theme/defaultTheme";
import { saveTheme, loadTheme } from "../theme/themeStorage";
import { KeyboardLayoutConfig, DEFAULT_LAYOUT_CONFIG } from "../theme/layoutTypes";
import { saveLayoutConfig, loadLayoutConfig } from "../theme/layoutStorage";
import KeyboardPreviewView from "../../modules/keyboard-preview";
import Card from "../components/Card";
import SegmentedControl from "../components/SegmentedControl";
import ColorField from "../components/ColorField";
import AnimatedPressable from "../components/AnimatedPressable";
import LayoutOverrideEditor from "../components/LayoutOverrideEditor";

const HEIGHT_OPTIONS: {
  label: string;
  value: KeyboardTheme["layout"]["keyboardHeight"];
}[] = [
  { label: "Compact", value: "compact" },
  { label: "Regular", value: "regular" },
  { label: "Tall", value: "tall" },
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

const COLOR_KEYS: (keyof KeyboardTheme["colors"])[] = [
  "background",
  "keyBackground",
  "keyBackgroundPressed",
  "keyText",
  "specialKeyBackground",
  "accent",
];

const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

function SectionHeader({ title, accent }: { title: string; accent: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionBar, { backgroundColor: accent }]} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function ThemeEditorScreen() {
  // Keychain access is async, so we can't load synchronously in useState
  // the way the old App-Group-backed version did. Start from the default
  // and swap in the real saved theme once it's loaded.
  const [theme, setTheme] = useState<KeyboardTheme>(DEFAULT_THEME);
  const [layoutConfig, setLayoutConfig] = useState<KeyboardLayoutConfig>(DEFAULT_LAYOUT_CONFIG);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");

  const entrance = useRef(new Animated.Value(0)).current;
  const savedOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadTheme().then(setTheme);
    loadLayoutConfig().then(setLayoutConfig);
    Animated.timing(entrance, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, []);

  const setColor = (key: keyof KeyboardTheme["colors"], value: string) =>
    setTheme((t) => ({ ...t, colors: { ...t.colors, [key]: value } }));

  const setCornerRadius = (value: number) =>
    setTheme((t) => ({ ...t, layout: { ...t.layout, keyCornerRadius: value } }));

  const handleSave = async () => {
    await Promise.all([saveTheme(theme), saveLayoutConfig(layoutConfig)]);
    setSaveState("saved");
    savedOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(savedOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(1400),
      Animated.timing(savedOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setSaveState("idle"));
  };

  // Tint the segmented controls and save button with the theme's own accent
  // color, so the editor UI feels connected to the thing it's editing
  // instead of using a hardcoded blue everywhere. Falls back to iOS blue
  // while the field holds an invalid/in-progress hex value.
  const accent = HEX_RE.test(theme.colors.accent) ? theme.colors.accent : "#007AFF";

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Animated.View
        style={{
          opacity: entrance,
          transform: [
            {
              translateY: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
          ],
        }}
      >
        <Text style={styles.eyebrow}>KEYBOARD THEME</Text>
        <Text style={styles.h1}>Design your keyboard</Text>

        {/* --- Live preview ---
            This is the REAL KeyboardView (same Swift code path, same
            ThemedKeyboardStyleService as the extension), rendered through a
            native UIHostingController bridge - not a JS recreation. See
            modules/keyboard-preview. Tap/hold keys to check
            keyBackgroundPressed the same way the extension applies it.
            Kept edge-to-edge (bleeding past the screen's own padding) on
            purpose, so it reads like a keyboard actually docked at the
            bottom of the screen rather than a boxed-in thumbnail. */}
        <View style={styles.previewHeader}>
          <View style={styles.liveDot} />
          <Text style={styles.previewLabel}>Live preview</Text>
        </View>
        <View style={styles.previewSection}>
          <KeyboardPreviewView
            themeJSON={JSON.stringify(theme)}
            layoutJSON={JSON.stringify(layoutConfig)}
            style={{ height: PREVIEW_HEIGHT[theme.layout.keyboardHeight] }}
          />
        </View>
      </Animated.View>

      <SectionHeader title="Colors" accent={accent} />
      <Card>
        {COLOR_KEYS.map((key, i) => (
          <React.Fragment key={key}>
            <ColorField
              label={key}
              value={theme.colors[key]}
              onChangeText={(v) => setColor(key, v)}
            />
            {i < COLOR_KEYS.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </Card>

      <SectionHeader title="Layout" accent={accent} />
      <Card style={styles.layoutCard}>
        <Text style={styles.fieldLabel}>Keyboard height</Text>
        <SegmentedControl
          options={HEIGHT_OPTIONS}
          value={theme.layout.keyboardHeight}
          accentColor={accent}
          onChange={(v) =>
            setTheme((t) => ({ ...t, layout: { ...t.layout, keyboardHeight: v } }))
          }
        />
        <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Corner style</Text>
        <SegmentedControl
          options={CORNER_OPTIONS}
          value={theme.layout.keyCornerRadius}
          accentColor={accent}
          onChange={setCornerRadius}
        />
      </Card>

      <SectionHeader title="Key remapping" accent={accent} />
      <Card>
        <LayoutOverrideEditor
          overrides={layoutConfig.overrides}
          onChange={(overrides) => setLayoutConfig((c) => ({ ...c, overrides }))}
          accentColor={accent}
        />
      </Card>

      <SectionHeader title="Feedback" accent={accent} />
      <Card>
        <View style={styles.row}>
          <Text style={styles.fieldLabel}>Haptics</Text>
          <Switch
            value={theme.hapticsEnabled}
            onValueChange={(v) => setTheme((t) => ({ ...t, hapticsEnabled: v }))}
            trackColor={{ true: accent }}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.fieldLabel}>Key sounds</Text>
          <Switch
            value={theme.soundEnabled}
            onValueChange={(v) => setTheme((t) => ({ ...t, soundEnabled: v }))}
            trackColor={{ true: accent }}
          />
        </View>
      </Card>

      <AnimatedPressable
        style={[styles.saveButton, { backgroundColor: accent }]}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>
          {saveState === "saved" ? "Saved" : "Save changes"}
        </Text>
        <Animated.Text style={[styles.checkmark, { opacity: savedOpacity }]}>
          {"  \u2713"}
        </Animated.Text>
      </AnimatedPressable>

      <Text style={styles.hint}>
        After saving, close and reopen the keyboard (switch apps or dismiss the
        keyboard and tap back into a text field) to see the new theme and key
        changes applied.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#F4F5FA" },
  container: { padding: 20, paddingTop: 64, paddingBottom: 48, gap: 16 },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#8B8FA3",
    marginBottom: 4,
  },
  h1: { fontSize: 26, fontWeight: "800", color: "#1A1B25", marginBottom: 16 },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#34C759",
    marginRight: 6,
  },
  previewLabel: { fontSize: 12, fontWeight: "600", color: "#8B8FA3" },
  // Bleeds past the ScrollView's own 20pt padding on both sides so the
  // preview reaches the actual screen edges, like a docked keyboard does.
  // The hairline top/bottom borders + off-white fill still frame it as its
  // own distinct panel instead of just floating loose in the layout.
  previewSection: {
    marginHorizontal: -20,
    marginBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#E4E6EE",
    backgroundColor: "#FAFAFC",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 2,
  },
  sectionBar: { width: 4, height: 14, borderRadius: 2, marginRight: 8 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1B25",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  layoutCard: { gap: 4 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B4F5E",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#E4E6EE" },
  saveButton: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  saveButtonText: { color: "white", fontWeight: "700", fontSize: 16 },
  checkmark: { color: "white", fontWeight: "700", fontSize: 16 },
  hint: {
    marginTop: 4,
    color: "#9297A8",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 8,
  },
});
