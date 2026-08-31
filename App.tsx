import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import ThemeEditorScreen from "./src/screens/ThemeEditorScreen";

export default function App() {
  return (
    <View style={styles.root}>
      <ThemeEditorScreen />
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F5FA" },
});
