'use strict';

const path = require('path');
const expect = require('chai').expect;

const Plugin = require('../lib/plugin');
const CACHE = Plugin.CACHE;
const Example = require('./plugins/example');

describe('Plugin', () => {
  const testPluginPath = path.join(__dirname, 'plugins', 'example');

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

      it('sets the plugin api version', () => {
        expect(plugin.apiVersion).to.equal('1.2.0');
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
    });
  });
});
