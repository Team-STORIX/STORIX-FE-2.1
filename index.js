import "@expo/metro-runtime";

import { withErrorOverlay } from "@expo/metro-runtime/error-overlay";
import { App } from "expo-router/build/qualified-entry";
import { AppRegistry } from "react-native";

try {
  require("./src/features/notification/services/registerBackgroundPushHandler").registerBackgroundPushHandler();
} catch (err) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn("[push] background handler skipped", err);
  }
}

const Root = process.env.NODE_ENV !== "production" ? withErrorOverlay(App) : App;

AppRegistry.registerComponent("main", () => Root);
