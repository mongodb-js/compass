import { expect } from 'chai';
import path from 'path';
import os from 'os';
import fs from 'fs';

import { getAggregations } from './aggregations';

const mockAggregations = [
  {
    id: '1234',
    name: 'aggregate by rating',
    namespace: 'mongodb.compass',
    lastModified: 123456789,
  },
  {
    id: '4321',
    name: 'aggregate by view count',
    namespace: 'mongodb.mongosh',
    lastModified: 987654321,
  },
];

const initialAggreatePathValue =
  process.env.MONGODB_COMPASS_AGGREGATE_TEST_BASE_PATH;

describe('Aggregations', function () {
  let tmpDir;
  before(function () {
    tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'saved-aggregations-queries-test')
    );
    fs.mkdirSync(path.join(tmpDir, 'SavedPipelines'));
    process.env.MONGODB_COMPASS_AGGREGATE_TEST_BASE_PATH = tmpDir;
    mockAggregations.forEach((aggregation) => {
      const fileName = path.join(
        tmpDir,
        'SavedPipelines',
        `${aggregation.id}.json`
      );
      fs.writeFileSync(fileName, JSON.stringify(aggregation));
    });
  });

  after(function () {
    process.env.MONGODB_COMPASS_AGGREGATE_TEST_BASE_PATH =
      initialAggreatePathValue;
    fs.rmdirSync(tmpDir, { recursive: true });
  });

  it('fetches all the saved aggregations', async function () {
    const result = await getAggregations();
    result.sort((a, b) => a.lastModified - b.lastModified);

    const aggregations = [...mockAggregations];
    aggregations.sort((a, b) => a.lastModified - b.lastModified);

    expect(result).to.deep.equal(aggregations);
  });
});
