module.exports = {
  colors: true,
  timeout: 15000,
  require: [
    'ts-node/register',
    path.resolve(__dirname, 'sinon-chai-register.js'),
  ],
  spec: 'src/**/*.spec.*',
  watchFiles: 'src/**/*',
};
