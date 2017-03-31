/* eslint no-unused-expressions: 0 */
const app = require('hadron-app');
const sinon = require('sinon');
const { remote } = require('electron');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
const COMPASS_ICON_PATH = require('../../src/icon').path;

// For `expect(mySpy).to.have.been.calledWith("foo");` syntax
chai.use(sinonChai);

describe('SchemaStore', function() {
  let writeText;
  let showMessageBox;

  beforeEach(function() {
    this.SchemaStore = app.appRegistry.getStore('Schema.Store');
    this.clipboardSpy = sinon.spy();
    this.messageBoxSpy = sinon.spy();
    writeText = remote.clipboard.writeText;
    showMessageBox = remote.dialog.showMessageBox;
    remote.clipboard.writeText = this.clipboardSpy;
    remote.dialog.showMessageBox = this.messageBoxSpy;
  });

  afterEach(function() {
    remote.clipboard.writeText = writeText;
    remote.dialog.showMessageBox = showMessageBox;
  });

  context('shares a "null" schema as JSON #race', function() {
    beforeEach(function() {
      // Note that normally this menu option is only exposed after the user has
      // connected to an instance, navigated to a collection and sampled schema
      this.SchemaStore.handleSchemaShare();
    });
    it('copies to the clipboard', function() {
      expect(this.clipboardSpy).to.have.been.calledWith('null');
    });
    it('displays an informative message box', function() {
      expect(this.messageBoxSpy).to.have.been.calledWith(null, {
        buttons: ['OK'],
        detail: 'The schema definition of ' +
        ' has been copied to your clipboard in JSON format.',
        icon: COMPASS_ICON_PATH,
        message: 'Share Schema',
        type: 'info'
      });
    });
  });
});
