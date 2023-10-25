import { expect } from 'chai';
import ipcMain from './main';

describe('ipcMain', () => {
  it('should have a respondTo method', () => {
    expect(ipcMain).to.have.property('respondTo');
  });

  it('should have a broadcast method', () => {
    expect(ipcMain).to.have.property('broadcast');
  });

  it('has a broadcastFocused method', () => {
    expect(ipcMain).to.have.property('broadcastFocused');
  });
});
