'use strict';

const os = require('os');
const path = require('path');
const expect = require('chai').expect;

const Plugin = require('../lib/plugin');
const CACHE = Plugin.CACHE;
const NAME_CACHE = Plugin.NAME_CACHE;
const Example = require('./plugins/example');

describe('Plugin', () => {
  const testPluginPath = path.join(__dirname, 'plugins', 'example');
  const testIllegalNamePluginPath = path.join(__dirname, 'plugins', 'illegal-example');

  describe('#activate', () => {
    context('when the activation has no errors', () => {
      const plugin = new Plugin(testPluginPath);

      context('when the plugin is not yet loaded', () => {
        beforeEach(() => {
          delete CACHE[testPluginPath];
        });

        it('loads the plugin and calls activate on the module', () => {
          expect(plugin.activate()).to.equal('test');
        });

        it('sets the plugin as activated', () => {
          expect(plugin.isActivated).to.equal(true);
        });
      });

      context('when the plugin is loaded', () => {
        it('calls #activate on the loaded module', () => {
          expect(plugin.activate()).to.equal('test');
        });
      });
    });

    context('when the activation errors', () => {
      const errorPluginPath = path.join(__dirname, 'plugins', 'example3');
      const plugin = new Plugin(errorPluginPath);

      before(() => {
        plugin.activate();
      });

      it('sets the plugin as not activated', () => {
        expect(plugin.isActivated).to.equal(false);
      });

      it('sets the plugin error', () => {
        expect(plugin.error.message).to.equal('error');
      });
    });

    context('when loading errors', () => {
      const errorPluginPath = path.join(__dirname, 'plugins', 'example4');
      const plugin = new Plugin(errorPluginPath);

      before(() => {
        plugin.activate();
      });

      it('sets the plugin as not activated', () => {
        expect(plugin.isActivated).to.equal(false);
      });

      it('sets the plugin error', () => {
        expect(plugin.error.message).to.include('Unexpected string');
      });
    });
  });

  describe('#load', () => {
    context('when loading does not error', () => {
      const plugin = new Plugin(testPluginPath);

      it('returns the module', () => {
        expect(plugin.load()).to.equal(Example);
      });

      it('sets the module in the cache', () => {
        expect(CACHE[testPluginPath]).to.equal(Example);
      });
    });
  });

  describe('#new', () => {
    context('when a package.json exists', () => {
      const plugin = new Plugin(testPluginPath, '1.2.0');

      it('sets the plugin path', () => {
        expect(plugin.pluginPath).to.equal(testPluginPath);
      });

      it('parses the package.json and sets the metadata', () => {
        expect(plugin.metadata.name).to.equal('test-plugin');
      });

      it('sets the application api version', () => {
        expect(plugin.applicationApiVersion).to.equal('1.2.0');
      });
    });

    context('when a package.json does not exist', () => {
      const badPluginPath = path.join(__dirname, 'internal-plugins', 'example6');
      const plugin = new Plugin(badPluginPath);

      it('sets the plugin path', () => {
        expect(plugin.pluginPath).to.equal(badPluginPath);
      });

      it('sets the metadata name to the plugin dir basename', () => {
        expect(plugin.metadata.name).to.equal('example6');
      });

      it('sets the error', () => {
        const fileName = path.join(plugin.pluginPath, 'package.json');
        expect(plugin.error.message).to.equal(`Cannot find module '${fileName}'`);
      });

      it('defaults the applicationApiVersion to 1.0.0', () => {
        expect(plugin.applicationApiVersion).to.equal('1.0.0');
      });
    });

    context('when the api version is in range of the api version', () => {
      let plugin;

      beforeEach(() => {
        delete NAME_CACHE['test-plugin'];
        plugin = new Plugin(testPluginPath, '1.2.0');
      });

      it('sets the application api version on the plugin', () => {
        expect(plugin.applicationApiVersion).to.equal('1.2.0');
      });

      it('does not error', () => {
        expect(plugin.error).to.equal(undefined);
      });
    });

    context('when the application api version is not in range of the api version', () => {
      let plugin;

      beforeEach(() => {
        delete NAME_CACHE['test-plugin'];
        plugin = new Plugin(testPluginPath, '2.0.0');
      });

      it('sets the application api version on the plugin', () => {
        expect(plugin.applicationApiVersion).to.equal('2.0.0');
      });

      it('sets the api version on the plugin', () => {
        expect(plugin.apiVersion).to.equal('1.0.0');
      });

      it('errors with the version exception', () => {
        expect(plugin.error.message).to.include('is not compatible with the application');
      });
    });

    context('when the plugin name already exists', () => {
      let plugin;

      beforeEach(() => {
        plugin = new Plugin(testPluginPath, '2.0.0');
      });

      it('sets the name collision error', () => {
        expect(plugin.error.message).to.include('Plugin with the name');
      });
    });

    context('when the plugin name starts with @mongodb-js', () => {
      context('when the plugin path is under .mongodb', () => {
        let plugin;

        beforeEach(() => {
          plugin = new Plugin(testIllegalNamePluginPath, '1.0.0');
          plugin.pluginPath = path.join(os.homedir(), '.mongodb', 'compass');
          plugin._validateNameLegality();
        });

        it('sets the name error', () => {
          expect(plugin.error.message).to.include('Plugin starting with');
        });
      });

      context('when the plugin path is not under .mongodb', () => {
        let plugin;

        beforeEach(() => {
          delete NAME_CACHE['@mongodb-js/test-plugin'];
          plugin = new Plugin(testIllegalNamePluginPath, '1.0.0');
        });

        it('sets no name error', () => {
          expect(plugin.error).to.equal(undefined);
        });
      });
    });
  });
});
