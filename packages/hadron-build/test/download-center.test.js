const assert = require('assert');
const { generateKey } = require('../lib/download-center');

describe('download-center', () => {
  describe('#generateKey', () => {
    context('when the channel is not stable', () => {
      context('when the id is for compass', () => {
        const config = { id: 'mongodb-compass', channel: 'beta' };

        it('returns compass/beta', () => {
          assert.equal(generateKey(config).download_center_key_prefix, 'compass/beta');
        });
      });

      context('when the id is for compass community', () => {
        const config = { id: 'mongodb-compass-community', channel: 'beta' };

        it('returns compass/beta', () => {
          assert.equal(generateKey(config).download_center_key_prefix, 'compass/beta');
        });
      });
    });

    context('when the channel is stable', () => {
      context('when the id is for compass', () => {
        const config = { id: 'mongodb-compass', channel: 'stable' };

        it('returns compass', () => {
          assert.equal(generateKey(config).download_center_key_prefix, 'compass');
        });
      });

      context('when the id is for compass community', () => {
        const config = { id: 'mongodb-compass-community', channel: 'stable' };

        it('returns compass', () => {
          assert.equal(generateKey(config).download_center_key_prefix, 'compass');
        });
      });
    });
  });
});
