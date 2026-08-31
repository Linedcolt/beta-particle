import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

interface Props {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}

const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const FRIENDLY_LABELS: Record<string, string> = {
  background: "Background",
  keyBackground: "Key background",
  keyBackgroundPressed: "Key (pressed)",
  keyText: "Key text",
  specialKeyBackground: "Special key",
  accent: "Accent",
};

export default function ColorField({ label, value, onChangeText }: Props) {
  const valid = HEX_RE.test(value);

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.swatch,
          valid ? { backgroundColor: value } : styles.swatchInvalid,
        ]}
      />
      <Text style={styles.label}>{FRIENDLY_LABELS[label] ?? label}</Text>
      <TextInput
        style={[styles.input, !valid && styles.inputInvalid]}
        value={value}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder="#RRGGBB"
        placeholderTextColor="#B5B8C2"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#00000014",
  },
  swatchInvalid: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FF3B30",
    borderStyle: "dashed",
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: "#1A1B25",
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E4E6EE",
    backgroundColor: "#FAFAFC",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 112,
    textAlign: "right",
    fontSize: 14,
    color: "#1A1B25",
  },
  inputInvalid: {
    borderColor: "#FF3B30",
  },
});
