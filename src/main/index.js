if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

require('./application').main();
