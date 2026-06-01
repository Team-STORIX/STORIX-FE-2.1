import "@expo/metro-runtime";

import { withErrorOverlay } from "@expo/metro-runtime/error-overlay";
import { App } from "expo-router/build/qualified-entry";
import { AppRegistry } from "react-native";

const Root = process.env.NODE_ENV !== "production" ? withErrorOverlay(App) : App;

AppRegistry.registerComponent("main", () => Root);
