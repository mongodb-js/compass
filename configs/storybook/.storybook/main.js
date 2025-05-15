const path = require('path');
const webpack = require('webpack');

const monorepoRoot = path.resolve(__dirname, '../../../');

module.exports = {
  stories: [
    'packages/*/src/**/*.stories.@(js|jsx|ts|tsx)',
    'packages/*/src/**/*.stories.mdx',
  ].map((story) => path.resolve(monorepoRoot, story)),
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-viewport',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  docs: {
    autodocs: true,
  },
  webpackFinal: async (config) => {
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      use: [
        {
          loader: require.resolve('ts-loader'),
          options: {
            transpileOnly: true,
          },
        },
      ],
    });

    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve('buffer/'),
      stream: require.resolve('stream-browserify'),
      crypto: require.resolve('crypto-browserify'),
      path: require.resolve('path-browserify'),
      fs: false,
      os: require.resolve('os-browserify/browser'),
    };

    // Add Buffer polyfill
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      })
    );

    return config;
  },
};
