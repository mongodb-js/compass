const path = require('path');
const { expect } = require('chai');
const { App } = require('../');

describe('App', function() {
  this.slow(30000);
  this.timeout(60000);

  const root = path.join(__dirname, '..');

  describe('#constructor', () => {
    const app = new App(root);

    it('sets the root', () => {
      expect(app.root).to.equal(root);
    });

    it('sets the spectron application', () => {
      expect(app.app.workingDirectory).to.equal(root);
    });
  });

  describe('#electronPackage', () => {
    const app = new App(root);

    it('returns the electron package location', () => {
      expect(app.electronPackage()).to.equal(
        path.join(root, 'node_modules', 'electron')
      );
    });
  });

  describe('#electronPath', () => {
    const app = new App(root);

    it('returns the electron path.txt location', () => {
      expect(app.electronPath()).to.equal(
        path.join(root, 'node_modules', 'electron', 'path.txt')
      );
    });
  });

  describe('#electronExecutable', () => {
    const app = new App(root);

    it('returns the electron executable location', () => {
      expect(app.electronExecutable()).to.include(
        path.join(root, 'node_modules', 'electron', 'dist')
      );
    });
  });

  describe('#launch', () => {
    context('when the app has no loading window', () => {
      const app = new App(root, path.join(__dirname, 'fixtures', 'standard'));

      after(() => {
        return app.quit();
      });

      it('sets the client on the app', () => {
        return app.launch().then(() => {
          expect(app.client.value).to.equal(undefined);
        });
      });
    });

    context('when the app has a loading window', () => {
      const app = new App(root, path.join(__dirname, 'fixtures', 'loading'));

      after(() => {
        return app.quit();
      });

      it('sets the client on the app', () => {
        return app.launch().then(() => {
          expect(app.client.value).to.equal(undefined);
        });
      });
    });
  });
});
