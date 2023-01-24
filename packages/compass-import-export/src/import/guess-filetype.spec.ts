import path from 'path';
import { expect } from 'chai';
import fs from 'fs';
import { guessFileType } from './guess-filetype';
import { fixtures } from '../../test/fixtures';

const expectedDelimiters = {
  'bad.csv': ',',
  'good-commas.csv': ',',
  'good-tabs.csv': '\t',
  'number-transform.csv': ',',
  'sparse.csv': ',',
  'semicolons.csv': ';',
  'spaces.csv': ' ',
  'array.csv': ',',
  'object.csv': ',',
  'complex.csv': ',',
} as const;

describe('guessFileType', function () {
  for (const filepath of Object.values(fixtures.json)) {
    const basename = path.basename(filepath);
    it(`detects ${basename} as json`, async function () {
      const input = fs.createReadStream(filepath);
      const { type } = await guessFileType({ input });
      expect(type).to.equal('json');
    });
  }

  for (const filepath of Object.values(fixtures.jsonl)) {
    const basename = path.basename(filepath);
    it(`detects ${basename} as jsonl`, async function () {
      const input = fs.createReadStream(filepath);
      const { type } = await guessFileType({ input });
      expect(type).to.equal('jsonl');
    });
  }

  for (const filepath of Object.values(fixtures.csv)) {
    const basename = path.basename(filepath);
    it(`detects ${basename} as csv`, async function () {
      const input = fs.createReadStream(filepath);
      const result = await guessFileType({ input });
      expect(result.type).to.equal('csv');
      const expectedDelimiter =
        expectedDelimiters[basename as keyof typeof expectedDelimiters];
      if (expectedDelimiter) {
        expect(result.type === 'csv' && result.csvDelimiter).to.equal(
          expectedDelimiter
        );
      } else {
        expect(result.type === 'csv' && result.csvDelimiter).to.equal(
          `add an entry for ${basename} to expectedDelimiters`
        );
      }
    });
  }

  // strip out known false positives
  const unknownFiles = Object.values(fixtures.other).filter(
    (filepath) => !filepath.endsWith('javascript')
  );

  for (const filepath of unknownFiles) {
    const basename = path.basename(filepath);
    it(`detects ${basename} as unknown`, async function () {
      const input = fs.createReadStream(filepath);
      const { type } = await guessFileType({ input });
      expect(type).to.equal('unknown');
    });
  }

  it('can treat javascript as a json false positive', async function () {
    const input = fs.createReadStream(fixtures.other.javascript);
    const { type } = await guessFileType({ input });
    expect(type).to.equal('json');
  });
});
