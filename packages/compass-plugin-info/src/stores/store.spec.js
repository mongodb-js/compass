import app from 'hadron-app';
import AppRegistry from 'hadron-app-registry';
import PluginManager from 'hadron-plugin-manager';
import Store from 'stores';
import { corePlugin, extPlugin } from '../../test/renderer/fixtures';

describe('SecurityStore [Store]', () => {
  const registry = new AppRegistry();
  const manager = new PluginManager([], __dirname, []);
  manager.plugins = [ corePlugin, extPlugin ];

  beforeEach(() => {
    Store.setState(Store.getInitialState());
    global.hadronApp = app;
    global.hadronApp.pluginManager = manager;
  });

  it('defaults isVisible to false', () => {
    expect(Store.state.isVisible).to.equal(false);
  });

  it('defaults the plugin list to empty', () => {
    expect(Store.state.plugins).to.deep.equal([]);
  });

  describe('#onActivated', () => {
    it('sets the plugins on the store', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.plugins.length).to.equal(2);
        done();
      });
      Store.onActivated(registry);
    });
  });

  describe('#show', () => {
    it('sets isVisible to true', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.isVisible).to.equal(true);
        done();
      });
      Store.show();
    });
  });

  describe('#hide', () => {
    it('sets isVisible to false', () => {
      Store.hide();
      expect(Store.state.isVisible).to.equal(false);
    });
  });
});
