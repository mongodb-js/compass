import { expect } from 'chai';
import * as release from './release';

describe('commands/release', function () {
  it('exports command string', function () {
    expect(release.command).to.be.a('string');
    expect(release.command).to.equal('release');
  });

  it('exports describe string', function () {
    expect(release.describe).to.be.a('string');
  });

  it('exports builder object with expected options', function () {
    expect(release.builder).to.have.property('dir');
    expect(release.builder).to.have.property('skip_installer');
    expect(release.builder).to.have.property('no_asar');
  });

  it('exports run function', function () {
    expect(release.run).to.be.a('function');
  });

  it('exports handler function', function () {
    expect(release.handler).to.be.a('function');
  });
});
