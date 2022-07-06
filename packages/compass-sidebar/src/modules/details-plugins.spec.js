import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  LOAD_DETAILS_PLUGINS,
  loadDetailsPlugins
} from './details-plugins';
import AppRegistry from 'hadron-app-registry';

describe('details-plugins module', function () {
  const appRegistry = new AppRegistry();

  describe('reducer', function () {
    before(function () {
      appRegistry.registerRole('Sample.Item', { name: 'SAMPLE' });
    });

    after(function () {
      appRegistry.deregisterRole('Sample.Item', { name: 'SAMPLE' });
    });

    context('when the action is loadDetailsPlugins', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, loadDetailsPlugins(appRegistry))).to.deep.equal(INITIAL_STATE);
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {})).to.deep.equal(INITIAL_STATE);
      });
    });
  });

  describe('#loadDetailsPlugins', function () {
    context('when role is not registered', function () {
      it('sets the empty array', function () {
        expect(loadDetailsPlugins(appRegistry)).to.deep.equal({
          type: LOAD_DETAILS_PLUGINS,
          roles: INITIAL_STATE
        });
      });
    });

    context('when role does not match', function () {
      before(function () {
        appRegistry.registerRole('Sample.Item', { name: 'SAMPLE' });
      });

      after(function () {
        appRegistry.deregisterRole('Sample.Item', { name: 'SAMPLE' });
      });

      it('sets the empty array', function () {
        expect(loadDetailsPlugins(appRegistry)).to.deep.equal({
          type: LOAD_DETAILS_PLUGINS,
          roles: INITIAL_STATE
        });
      });
    });

    context('when `InstanceDetails.Item` is present', function () {
      before(function () {
        appRegistry.registerRole('InstanceDetails.Item', { name: 'INSTANCEDETAILS' });
      });

      after(function () {
        appRegistry.deregisterRole('InstanceDetails.Item', { name: 'INSTANCEDETAILS' });
      });

      it('sets the roles array', function () {
        expect(loadDetailsPlugins(appRegistry)).to.deep.equal({
          type: LOAD_DETAILS_PLUGINS,
          roles: [{ name: 'INSTANCEDETAILS' }]
        });
      });
    });
  });
});
