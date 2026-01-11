module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      function() {
        return {
          visitor: {
            MemberExpression(path) {
              const replacements = {
                'process.env.EXPO_ROUTER_APP_ROOT': '../../app',
                'process.env.EXPO_ROUTER_IMPORT_MODE': 'sync',
                'process.env.EXPO_ROUTER_CONTEXT_MODULE': '../../app',
              };
              for (const [key, value] of Object.entries(replacements)) {
                if (path.matchesPattern(key)) {
                  path.replaceWith({ type: 'StringLiteral', value });
                }
              }
            }
          }
        };
      },
      'react-native-reanimated/plugin',
    ],
  };
};
