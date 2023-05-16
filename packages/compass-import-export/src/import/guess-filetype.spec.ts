import path from 'path';
import { expect } from 'chai';
import fs from 'fs';
import { Readable } from 'stream';
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
  'many-columns.csv': ',',
  'linebreaks.csv': ',',
} as const;

describe('guessFileType', function () {
  it('detects unknown for a file that is just one very long line', async function () {
    const chars: string[] = [];
    for (let i = 0; i < 1000001; i++) {
      chars.push('x');
    }
    const input = Readable.from(chars.join(''));
    const { type } = await guessFileType({ input });
    expect(type).to.equal('unknown');
  });

  it('detects unknown for a file where the second line is very long', async function () {
    const chars: string[] = ['x', '\n']; // there is one line break
    for (let i = 0; i < 1000001; i++) {
      chars.push('x');
    }
    const input = Readable.from(chars.join(''));
    const { type } = await guessFileType({ input });
    expect(type).to.equal('unknown');
  });

  it('detects json as long as there is one square bracket', async function () {
    const chars: string[] = ['[', '\n']; // there is one line break
    for (let i = 0; i < 1000001; i++) {
      chars.push('x');
    }
    const input = Readable.from(chars.join(''));
    const { type } = await guessFileType({ input });
    expect(type).to.equal('json');
  });

  it('detects json for one square bracket even if it is otherwise valid csv', async function () {
    const input = Readable.from('[a,b\n1,2');
    const { type } = await guessFileType({ input });
    expect(type).to.equal('json');
  });

  it('detects jsonl for anything starting with {', async function () {
    const input = Readable.from('{a,b\n1,2');
    const { type } = await guessFileType({ input });
    expect(type).to.equal('jsonl');
  });

  it('detects json for a file with lots of fields', async function () {
    const bigDocs: any[] = [];
    for (let i = 0; i < 100; i++) {
      const doc: any = {};
      for (let j = 0; j < 100; j++) {
        doc[`c_${j}`] = 'abcdefghijklmnop';
      }
      bigDocs.push(doc);
    }
    const jsonText = JSON.stringify(bigDocs);
    const input = Readable.from(jsonText);
    const { type } = await guessFileType({ input });
    expect(type).to.equal('json');
  });

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
        expect((result as { newline: string }).newline).to.equal('\n');
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

  it('does not mind windows style line breaks', async function () {
    async function stringStream(path: string) {
      const text = await fs.promises.readFile(path, 'utf8');
      return Readable.from(text.replace(/\n/g, '\r\n'));
    }

    const csvResult = await guessFileType({
      input: await stringStream(fixtures.csv.good_commas),
    });
    expect(csvResult.type).to.equal('csv');
    expect((csvResult as { newline: string }).newline).to.equal('\r\n');

    const jsonResult = await guessFileType({
      input: await stringStream(fixtures.json.good),
    });
    expect(jsonResult.type).to.equal('json');

    const jsonlResult = await guessFileType({
      input: await stringStream(fixtures.jsonl.good),
    });
    expect(jsonlResult.type).to.equal('jsonl');
  });

  it('errors if a file is not valid utf8', async function () {
    const latin1Buffer = Buffer.from('ê,foo\n1,2', 'latin1');

    await expect(
      guessFileType({
        input: Readable.from(latin1Buffer),
      })
    ).to.be.rejectedWith(
      TypeError,
      'The encoded data was not valid for encoding utf-8'
    );
  });

  it('does not mind a BOM character', async function () {
    const csvText = await fs.promises.readFile(
      fixtures.csv.good_commas,
      'utf8'
    );
    const csvInput = Readable.from('\uFEFF' + csvText);
    const csvResult = await guessFileType({
      input: csvInput,
    });
    expect(csvResult.type).to.equal('csv');

    const jsonText = await fs.promises.readFile(fixtures.json.good, 'utf8');
    const jsonInput = Readable.from('\uFEFF' + jsonText);
    const jsonResult = await guessFileType({
      input: jsonInput,
    });
    expect(jsonResult.type).to.equal('json');

    const jsonlText = await fs.promises.readFile(fixtures.jsonl.good, 'utf8');
    const jsonlInput = Readable.from('\uFEFF' + jsonlText);
    const jsonlResult = await guessFileType({
      input: jsonlInput,
    });
    expect(jsonlResult.type).to.equal('jsonl');
  });
});
