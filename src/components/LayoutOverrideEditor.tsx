import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyOverride, ROW_LABELS } from "../theme/layoutTypes";
import SegmentedControl from "./SegmentedControl";

interface Props {
  overrides: KeyOverride[];
  onChange: (overrides: KeyOverride[]) => void;
  accentColor: string;
}

const ROW_OPTIONS: { label: string; value: 0 | 1 | 2 }[] = [
  { label: "Top", value: 0 },
  { label: "Home", value: 1 },
  { label: "Bottom", value: 2 },
];

type ActionChoice = "keep" | "character" | "backspace" | "shift";

const ACTION_OPTIONS: { label: string; value: ActionChoice }[] = [
  { label: "Keep", value: "keep" },
  { label: "Character", value: "character" },
  { label: "Backspace", value: "backspace" },
  { label: "Shift", value: "shift" },
];

function summarize(o: KeyOverride): string {
  const parts: string[] = [];
  if (o.action) {
    parts.push(
      o.action.type === "character"
        ? `becomes "${o.action.value ?? ""}"`
        : `becomes ${o.action.type}`
    );
  }
  if (o.widthWeight !== undefined) parts.push(`\u00d7${o.widthWeight} width`);
  return parts.length ? parts.join(", ") : "width/action unchanged";
}

/**
 * Editor for KeyboardLayoutConfig.overrides - see src/theme/layoutTypes.ts
 * for the scope (top/home/bottom letter rows only) and RemappableLayoutService.swift
 * for how these get applied on top of KeyboardKit's real standard layout.
 */
export default function LayoutOverrideEditor({ overrides, onChange, accentColor }: Props) {
  const [row, setRow] = useState<0 | 1 | 2>(0);
  const [position, setPosition] = useState("1"); // 1-based in the UI, converted below
  const [actionChoice, setActionChoice] = useState<ActionChoice>("keep");
  const [charValue, setCharValue] = useState("");
  const [widthWeight, setWidthWeight] = useState("1");

  const addOverride = () => {
    const idx = parseInt(position, 10) - 1;
    if (Number.isNaN(idx) || idx < 0) return;

    const override: KeyOverride = { row, index: idx };

    if (actionChoice === "character" && charValue.trim()) {
      override.action = { type: "character", value: charValue.trim() };
    } else if (actionChoice === "backspace") {
      override.action = { type: "backspace" };
    } else if (actionChoice === "shift") {
      override.action = { type: "shift" };
    }

    const weight = parseFloat(widthWeight);
    if (!Number.isNaN(weight) && weight > 0 && weight !== 1) {
      override.widthWeight = weight;
    }

    if (!override.action && override.widthWeight === undefined) return;

    // A second override at the same slot replaces the first rather than
    // stacking - RemappableLayoutService only ever sees one per slot anyway.
    const next = overrides.filter((o) => !(o.row === row && o.index === idx));
    next.push(override);
    onChange(next);

    setActionChoice("keep");
    setCharValue("");
    setWidthWeight("1");
  };

  const removeOverride = (target: KeyOverride) => {
    onChange(overrides.filter((o) => !(o.row === target.row && o.index === target.index)));
  };

  return (
    <View>
      {overrides.length === 0 ? (
        <Text style={styles.empty}>
          No overrides yet - the keyboard uses the standard layout.
        </Text>
      ) : (
        overrides.map((o) => (
          <View key={`${o.row}-${o.index}`} style={styles.existingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.existingLabel}>
                {ROW_LABELS[o.row]}, key {o.index + 1}
              </Text>
              <Text style={styles.existingSummary}>{summarize(o)}</Text>
            </View>
            <Pressable onPress={() => removeOverride(o)} hitSlop={8}>
              <Text style={styles.remove}>Remove</Text>
            </Pressable>
          </View>
        ))
      )}

      <View style={styles.divider} />

      <Text style={styles.fieldLabel}>Row</Text>
      <SegmentedControl options={ROW_OPTIONS} value={row} onChange={setRow} accentColor={accentColor} />

      <View style={styles.formRow}>
        <Text style={styles.fieldLabel}>Key position (from the left, starting at 1)</Text>
        <TextInput
          style={styles.numberInput}
          value={position}
          onChangeText={setPosition}
          keyboardType="number-pad"
        />
      </View>

      <Text style={[styles.fieldLabel, { marginTop: 14, marginBottom: 8 }]}>
        Action
      </Text>
      <SegmentedControl
        options={ACTION_OPTIONS}
        value={actionChoice}
        onChange={setActionChoice}
        accentColor={accentColor}
      />

      {actionChoice === "character" && (
        <TextInput
          style={styles.charInput}
          value={charValue}
          onChangeText={setCharValue}
          placeholder="New character, e.g. \u00e9"
          placeholderTextColor="#B5B8C2"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={4}
        />
      )}

      <View style={styles.formRow}>
        <Text style={styles.fieldLabel}>Width multiplier (1 = normal)</Text>
        <TextInput
          style={styles.numberInput}
          value={widthWeight}
          onChangeText={setWidthWeight}
          keyboardType="decimal-pad"
        />
      </View>

      <Pressable
        style={[styles.addButton, { backgroundColor: accentColor }]}
        onPress={addOverride}
      >
        <Text style={styles.addButtonText}>Set key</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 13,
    color: "#9297A8",
    paddingVertical: 8,
  },
  existingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  existingLabel: { fontSize: 14, fontWeight: "600", color: "#1A1B25" },
  existingSummary: { fontSize: 12, color: "#8B8FA3", marginTop: 2 },
  remove: { fontSize: 13, fontWeight: "600", color: "#FF3B30" },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E4E6EE",
    marginVertical: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B4F5E",
    marginBottom: 8,
  },
  formRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: "#E4E6EE",
    backgroundColor: "#FAFAFC",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 72,
    textAlign: "center",
    fontSize: 14,
    color: "#1A1B25",
  },
  charInput: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E4E6EE",
    backgroundColor: "#FAFAFC",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#1A1B25",
  },
  addButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  addButtonText: { color: "white", fontWeight: "700", fontSize: 14 },
});
