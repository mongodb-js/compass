import path from 'path';
import os from 'os';
import { expect } from 'chai';
import fs from 'fs/promises';

import { HistoryStorage } from './history-storage';

describe('HistoryStorage', function () {
  let tmpDir;
  let historyFilePath;

  let historyStorage;

  beforeEach(async function () {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'compass-shell-test'));
    historyFilePath = path.join(tmpDir, 'shell-history.json');

    historyStorage = new HistoryStorage(tmpDir);
  });

  afterEach(async function () {
    await fs.rm(tmpDir, { recursive: true });
  });

  describe('#save', function () {
    it('creates the file and directory if not existing', async function () {
      expect(async () => await fs.access(historyFilePath)).to.throw;

      await historyStorage.save([]);

      expect(async () => await fs.access(historyFilePath)).to.not.throw;
    });

    it('stores entries', async function () {
      await historyStorage.save(['entry-2', 'entry-1']);

      const content = await fs.readFile(historyFilePath, 'utf-8');
      expect(content).to.contain('entry-1');
      expect(content).to.contain('entry-2');
    });

    it('replaces the file content', async function () {
      await historyStorage.save(['entry-1']);
      await historyStorage.save(['entry-2']);

      const content = await fs.readFile(historyFilePath, 'utf-8');
      expect(content).not.to.contain('entry-1');
      expect(content).to.contain('entry-2');
    });
  });

  describe('#load', function () {
    it('loads saved entries', async function () {
      const entriesToSave = ['entry-2', 'entry-1'];
      await historyStorage.save(entriesToSave);

      const entries = await historyStorage.load();
      expect(entries).to.deep.equal(entriesToSave);
    });

    it('returns an empty array if the file does not exist', async function () {
      try {
        await fs.access(historyFilePath);
        expect.fail('Expected file to not exist');
      } catch (e) {
        expect(e.code).to.equal('ENOENT');
      }
      expect(await historyStorage.load()).to.deep.equal([]);
    });
  });
});
