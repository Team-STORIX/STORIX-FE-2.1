const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.blockList =
  /.*(?:node_modules[\\/]react-native-[^\\/]+[\\/]android[\\/]\.cxx|android[\\/](?:app[\\/]build|\.gradle))[\\/].*/;

module.exports = config;
