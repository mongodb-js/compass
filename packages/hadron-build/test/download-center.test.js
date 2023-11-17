const { expect } = require('chai');
const {
  getKeyPrefix,
  requireEnvironmentVariables
} = require('../lib/download-center');

describe('download-center', function() {
  describe('getKeyPrefix', function() {
    it('should return compass for stable channel', function() {
      expect(getKeyPrefix('stable')).to.eq('compass');
    });

    it('should return compass when no channel is passed', function() {
      expect(getKeyPrefix()).to.eq('compass');
    });

    it('should return prefix with channel when channel is not stable', function() {
      expect(getKeyPrefix('beta')).to.eq('compass/beta');
    });
  });

  describe('requireEnvironmentVariables', function() {
    it('should throw if variable is missing', function() {
      expect(() => {
        requireEnvironmentVariables([
          'I_WOULD_BE_REALLY_SURPRISED_IF_THIS_ACTUALLY_EXISTS'
        ]);
      }).to.throw();
    });

    it('should return true if variable is set', function() {
      try {
        process.env.THIS_IS_HERE_TO_TEST_REQUIRE_ENV_VARIABLES_METHOD = '1';
        expect(
          requireEnvironmentVariables([
            'THIS_IS_HERE_TO_TEST_REQUIRE_ENV_VARIABLES_METHOD'
          ])
        ).to.eq(true);
      } finally {
        delete process.env.THIS_IS_HERE_TO_TEST_REQUIRE_ENV_VARIABLES_METHOD;
      }
    });
  });
});
