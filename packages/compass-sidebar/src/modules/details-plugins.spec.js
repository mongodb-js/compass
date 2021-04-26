import reducer, {
  INITIAL_STATE,
  LOAD_DETAILS_PLUGINS,
  loadDetailsPlugins
} from 'modules/details-plugins';
import AppRegistry from 'hadron-app-registry';

describe('details-plugins module', () => {
  const appRegistry = new AppRegistry();

  describe('reducer', () => {
    before(() => {
      appRegistry.registerRole('Sample.Item', { name: 'SAMPLE' });
    });

    after(() => {
      appRegistry.deregisterRole('Sample.Item', { name: 'SAMPLE' });
    });

    context('when the action is loadDetailsPlugins', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, loadDetailsPlugins(appRegistry))).to.deep.equal(INITIAL_STATE);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.deep.equal(INITIAL_STATE);
      });
    });
  });

  describe('#loadDetailsPlugins', () => {
    context('when role is not registered', () => {
      it('sets the empty array', () => {
        expect(loadDetailsPlugins(appRegistry)).to.deep.equal({
          type: LOAD_DETAILS_PLUGINS,
          roles: INITIAL_STATE
        });
      });
    });

    context('when role does not match', () => {
      before(() => {
        appRegistry.registerRole('Sample.Item', { name: 'SAMPLE' });
      });

      after(() => {
        appRegistry.deregisterRole('Sample.Item', { name: 'SAMPLE' });
      });

      it('sets the empty array', () => {
        expect(loadDetailsPlugins(appRegistry)).to.deep.equal({
          type: LOAD_DETAILS_PLUGINS,
          roles: INITIAL_STATE
        });
      });
    });

    context('when `InstanceDetails.Item` is present', () => {
      before(() => {
        appRegistry.registerRole('InstanceDetails.Item', { name: 'INSTANCEDETAILS' });
      });

      after(() => {
        appRegistry.deregisterRole('InstanceDetails.Item', { name: 'INSTANCEDETAILS' });
      });

      it('sets the roles array', () => {
        expect(loadDetailsPlugins(appRegistry)).to.deep.equal({
          type: LOAD_DETAILS_PLUGINS,
          roles: [{ name: 'INSTANCEDETAILS' }]
        });
      });
    });
  });
});
