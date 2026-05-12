import { expect } from 'chai';
import * as download from './download';

describe('commands/download', function () {
  it('exports command string', function () {
    expect(download.command).to.be.a('string');
    expect(download.command).to.include('download');
  });

  it('exports describe string', function () {
    expect(download.describe).to.be.a('string');
  });

  it('exports builder object with expected options', function () {
    expect(download.builder).to.have.property('dir');
    expect(download.builder).to.have.property('version');
  });

  it('exports run function', function () {
    expect(download.run).to.be.a('function');
  });

  it('exports handler function', function () {
    expect(download.handler).to.be.a('function');
  });
});
