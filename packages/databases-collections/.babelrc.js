module.exports = (api) => {
  api.cache.using(() => process.env.NODE_ENV);

  return {
    presets: [
      [
        require.resolve('@babel/preset-env'),
        {
          modules: api.env('test') ? 'commonjs' : false,
          useBuiltIns: 'usage',
          corejs: { version: '3.12', proposals: true }
        }
      ],
      require.resolve('@babel/preset-react')
    ],
    plugins: [
      require.resolve('@babel/plugin-syntax-dynamic-import'),
      [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
      // TODO: Replace with 'fast-refresh'
      // https://github.com/gaearon/react-hot-loader#moving-towards-next-step
      api.env('development') && require.resolve('react-hot-loader/babel')
    ].filter(Boolean)
  };
}
