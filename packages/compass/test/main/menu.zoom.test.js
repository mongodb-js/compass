const expect = require('chai').expect;
const { BrowserWindow, Menu } = require('electron');
const AppMenu = require('../../src/main/menu');
const _ = require('lodash');

describe('App Menu', () => {
  before(function() {
    const _window = new BrowserWindow({show: false});
    AppMenu.init();
    AppMenu.load(_window);
    const menuTemplate = AppMenu.getTemplate(_window.id);
    this.fullMenu = Menu.buildFromTemplate(menuTemplate);
  });
  context('View sub-menu', () => {
    before(function() {
      this.viewSubMenu = _.find(this.fullMenu.items, (menuItem) => {
        return menuItem.label === '&View';
      }).submenu;
    });
    it('contains a zoom reset item', function() {
      const zoomResetItem = _.find(this.viewSubMenu.items, (item) => {
        return item.label === 'Actual Size';
      });
      expect(zoomResetItem.accelerator).to.be.equal('CmdOrCtrl+0');
    });
    it('contains a zoom in item', function() {
      const zoomInItem = _.find(this.viewSubMenu.items, (menuItem) => {
        return menuItem.label === 'Zoom In';
      });
      expect(zoomInItem.accelerator).to.be.equal('CmdOrCtrl+Plus');
    });
    it('contains a zoom out item', function() {
      const zoomOutItem = _.find(this.viewSubMenu.items, (menuItem) => {
        return menuItem.label === 'Zoom Out';
      });
      expect(zoomOutItem.accelerator).to.be.equal('CmdOrCtrl+-');
    });
  });
});
