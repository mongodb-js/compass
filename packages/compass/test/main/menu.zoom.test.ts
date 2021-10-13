import { expect } from 'chai';
import { BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron';
import { CompassMenu } from '../../src/main/menu';
import _ from 'lodash';
import { EventEmitter } from 'stream';
import { CompassApplication } from '../../src/main/application';

describe('App Menu', function () {
  before(function () {
    const _window = new BrowserWindow({ show: false });
    CompassMenu.init(new EventEmitter() as CompassApplication);
    CompassMenu.load(_window);
    const menuTemplate = CompassMenu.getTemplate(
      _window.id
    ) as MenuItemConstructorOptions[];
    this.fullMenu = Menu.buildFromTemplate(menuTemplate);
  });
  context('View sub-menu', function () {
    before(function () {
      this.viewSubMenu = _.find(this.fullMenu.items, (menuItem) => {
        return menuItem.label === '&View';
      }).submenu;
    });
    it('contains a zoom reset item', function () {
      const zoomResetItem = _.find(this.viewSubMenu.items, (item) => {
        return item.label === 'Actual Size';
      });
      expect(zoomResetItem.accelerator).to.be.equal('CmdOrCtrl+0');
    });
    it('contains a zoom in item', function () {
      const zoomInItem = _.find(this.viewSubMenu.items, (menuItem) => {
        return menuItem.label === 'Zoom In';
      });
      expect(zoomInItem.accelerator).to.be.equal('CmdOrCtrl+=');
    });
    it('contains a zoom out item', function () {
      const zoomOutItem = _.find(this.viewSubMenu.items, (menuItem) => {
        return menuItem.label === 'Zoom Out';
      });
      expect(zoomOutItem.accelerator).to.be.equal('CmdOrCtrl+-');
    });
  });
});
