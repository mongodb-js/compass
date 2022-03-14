import reducer, * as actions from './global-app-registry';
import { expect } from 'chai';
import * as sinon from 'sinon';

describe('global-app-registry [module]', function () {
  const spy = sinon.spy();

  describe('#reducer', function () {
    context(
      'when the action type is GLOBAL_APP_REGISTRY_ACTIVATED',
      function () {
        const action = actions.globalAppRegistryActivated(spy);

        it('returns the new state', function () {
          expect(reducer('', action)).to.equal(spy);
        });
      }
    );

    context('when the action type is not recognised', function () {
      it('returns the initial state', function () {
        expect(reducer(undefined, {})).to.deep.equal(null);
      });
    });
  });
});
