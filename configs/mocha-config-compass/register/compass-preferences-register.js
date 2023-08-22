let setupPreferencesPromise;

module.exports = {
  mochaHooks: {
    async beforeAll() {
      // Only do this setup if we are not in electron environment, electron case
      // is handled in main-process.js
      if (typeof process.type !== 'undefined') {
        return;
      }
      // For compass-plugin test preset we want to make sure that the
      // environment is matching compass environment, including the implicit
      // preferences used by a lot of packages in the monorepo
      process.env.COMPASS_TEST_USE_PREFERENCES_SANDBOX =
        process.env.COMPASS_TEST_USE_PREFERENCES_SANDBOX ?? 'true';
      // Make sure we only do this once so that --watch mode doesn't try to set
      // up preferences again on re-run
      setupPreferencesPromise ??=
        require('compass-preferences-model').setupPreferences();
      // NB: Not adding this as a dep in package.json to avoid circular dependency
      await setupPreferencesPromise;
    },
  },
};
