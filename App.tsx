import { StatusBar } from "expo-status-bar";
import ThemeEditorScreen from "./src/screens/ThemeEditorScreen";

export default function App() {
  return (
    <>
      <ThemeEditorScreen />
      <StatusBar style="auto" />
    </>
  );
}
