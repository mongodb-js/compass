/* eslint-disable no-sync */
import path from 'path';
import os from 'os';
import rimraf from 'rimraf';
import { expect } from 'chai';
import fs from 'fs';

import { HistoryStorage } from './history-storage';

describe('HistoryStorage', function () {
  let tempDir;
  let historyFilePath;

  beforeEach(function () {
    tempDir = path.join(os.tmpdir(), `compass-shell-test-${Date.now()}`);
    historyFilePath = path.join(tempDir, 'shell-history.json');
  });

  afterEach(function (done) {
    rimraf(tempDir, done);
  });

  describe('#save', function () {
    it('creates the file and directory if not existing', async function () {
      expect(fs.existsSync(historyFilePath)).to.be.false;

      const historyStorage = new HistoryStorage(historyFilePath);
      await historyStorage.save([]);

      expect(fs.existsSync(historyFilePath)).to.be.true;
    });

    it('stores entries', async function () {
      const historyStorage = new HistoryStorage(historyFilePath);
      await historyStorage.save(['entry-2', 'entry-1']);

      const content = fs.readFileSync(historyFilePath, 'utf-8');
      expect(content).to.contain('entry-1');
      expect(content).to.contain('entry-2');
    });

    it('replaces the file content', async function () {
      const historyStorage = new HistoryStorage(historyFilePath);
      await historyStorage.save(['entry-1']);
      await historyStorage.save(['entry-2']);

      const content = fs.readFileSync(historyFilePath, 'utf-8');
      expect(content).not.to.contain('entry-1');
      expect(content).to.contain('entry-2');
    });
  });

  describe('#load', function () {
    it('loads saved entries', async function () {
      const entriesToSave = ['entry-2', 'entry-1'];
      const historyStorage = new HistoryStorage(historyFilePath);
      await historyStorage.save(entriesToSave);

      const entries = await historyStorage.load();
      expect(entries).to.deep.equal(entriesToSave);
    });

    it('returns an empty array if the file does not exist', async function () {
      const historyStorage = new HistoryStorage(historyFilePath);
      expect(fs.existsSync(historyFilePath)).to.be.false;
      expect(await historyStorage.load()).to.deep.equal([]);
    });
  });
});
