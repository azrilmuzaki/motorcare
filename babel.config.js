module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@core': './src/core',
            '@data': './src/data',
            '@domain': './src/domain',
            '@presentation': './src/presentation',
            '@assets': './assets',
          },
          extensions: ['.ts', '.tsx', '.js', '.jsx'],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
