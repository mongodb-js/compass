const { expect } = require('chai');
const fs = require('fs-extra');
const path = require('path');
const { replaceVersion, getSemverFromVersionId } = require('./download-center');

describe('getSemverFromVersionId', () => {
  it('gets the correct version', () => {
    const ids = [
      '1.22.1',
      '1.22.1-readonly',
      '1.22.1-isolated',
      '1.23.0-beta.4',
      '1.23.0-beta.4-readonly',
      '1.23.0-beta.4-isolated',
    ];

    expect(ids.map(getSemverFromVersionId)).to.deep.equal([
      '1.22.1',
      '1.22.1',
      '1.22.1',
      '1.23.0-beta.4',
      '1.23.0-beta.4',
      '1.23.0-beta.4',
    ]);
  });
});

describe('replaceVersion', () => {
  it('replaces all stable version with the new one', async() => {
    const original = await fs.readJSON(
      path.resolve(__dirname, 'fixtures', 'config.json')
    );

    const expected = await fs.readJSON(
      path.resolve(__dirname, 'fixtures', 'expected-ga.json')
    );

    const updated = replaceVersion(original, '1.23.0');
    expect(updated).to.deep.equal(expected);
  });

  it('replaces all beta versions with the new one', async() => {
    const original = await fs.readJSON(
      path.resolve(__dirname, 'fixtures', 'config.json')
    );

    const expected = await fs.readJSON(
      path.resolve(__dirname, 'fixtures', 'expected-beta.json')
    );

    const updated = replaceVersion(original, '1.23.0-beta.5');
    expect(updated).to.deep.equal(expected);
  });
});
