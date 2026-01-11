const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the workspace root
config.watchFolders = [projectRoot, workspaceRoot];

// Resolve modules from both project and workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Re-map imports to the root node_modules if needed
config.resolver.extraNodeModules = {
  'expo-local-authentication': path.resolve(workspaceRoot, 'node_modules/expo-local-authentication'),
  'expo-secure-store': path.resolve(workspaceRoot, 'node_modules/expo-secure-store'),
};

module.exports = config;
