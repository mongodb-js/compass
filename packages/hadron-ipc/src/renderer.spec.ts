import { expect } from 'chai';
import ipcRenderer from './renderer';

describe('ipcMain', () => {
  it('should have a call method', () => {
    expect(ipcRenderer).to.have.property('call');
  });

  it('should have a callQuiet method', () => {
    expect(ipcRenderer).to.have.property('callQuiet');
  });
});
