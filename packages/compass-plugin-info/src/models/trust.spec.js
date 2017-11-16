import isTrusted from 'models/trust';
import { corePlugin, extPlugin } from '../../test/renderer/fixtures';

describe('Trust', () => {
  describe('#isTrusted', () => {
    context('when the plugin name contains @mongodb-js', () => {
      it('returns true', () => {
        expect(isTrusted(corePlugin, {})).to.equal(true);
      });
    });

    context('when the plugin name does not contain @mongodb-js', () => {
      context('when no trust settings are saved', () => {
        it('returns false', () => {
          expect(isTrusted(extPlugin, {})).to.equal(false);
        });
      });

      context('when trust settings are saved', () => {
        context('when the plugin is trusted', () => {
          it('returns true', () => {

          });
        });

        context('when the plugin is not trusted', () => {
          it('returns false', () => {

          });
        });
      });
    });
  });
});
