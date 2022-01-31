/* eslint-disable no-sync */
import fs from 'fs';
import os from 'os';
import path from 'path';

import { readPipelinesFromStorage } from './saved-pipeline';

const initialAggregateValue = process.env.MONGODB_COMPASS_AGGREGATE_TEST_BASE_PATH;

const createPipeline = (tmpDir, data) => {
  fs.writeFileSync(
    path.join(tmpDir, 'SavedPipelines', `${data.id}.json`),
    JSON.stringify(data)
  );
};

describe('saved-pipeline', function() {
  let tmpDir;
  beforeEach(function() {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'SavedPipelines'));
    fs.mkdirSync(path.join(tmpDir, 'SavedPipelines'));
    process.env.MONGODB_COMPASS_AGGREGATE_TEST_BASE_PATH = tmpDir;
  });

  afterEach(function() {
    fs.rmdirSync(tmpDir, { recursive: true });
    process.env.MONGODB_COMPASS_AGGREGATE_TEST_BASE_PATH = initialAggregateValue;
  });

  it('should read saved aggregations', async function() {
    let aggregations = await readPipelinesFromStorage();
    expect(aggregations).to.have.length(0);

    const data = [
      {
        id: 1234567,
        name: 'hello',
      },
      {
        id: 7654321,
        name: 'world',
      },
    ];
    createPipeline(tmpDir, data[0]);
    createPipeline(tmpDir, data[1]);

    aggregations = await readPipelinesFromStorage();

    expect(aggregations).to.have.length(2);

    expect(aggregations[0]).to.have.property('lastModified');
    expect(aggregations[1]).to.have.property('lastModified');

    // Remove lastModified
    aggregations.map(x => {
      delete x.lastModified;
      return x;
    });

    expect(aggregations.find(x => x.id === data[0].id)).to.deep.equal(data[0]);
    expect(aggregations.find(x => x.id === data[1].id)).to.deep.equal(data[1]);
  });
});
