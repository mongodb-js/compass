/* eslint-disable no-sync */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { expect } from 'chai';

import { PipelineStorage } from './pipeline-storage';

const initialAggregationsPath =
  process.env.MONGODB_COMPASS_AGGREGATIONS_TEST_BASE_PATH;

const createPipeline = (tmpDir, data) => {
  fs.writeFileSync(
    path.join(tmpDir, 'SavedPipelines', `${data.id}.json`),
    JSON.stringify(data)
  );
};

const pipelineStorage = new PipelineStorage();

describe('PipelineStorage', function () {
  let tmpDir;
  beforeEach(function () {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'SavedPipelines'));
    fs.mkdirSync(path.join(tmpDir, 'SavedPipelines'));
    process.env.MONGODB_COMPASS_AGGREGATIONS_TEST_BASE_PATH = tmpDir;
  });

  afterEach(function () {
    fs.rmdirSync(tmpDir, { recursive: true });
    process.env.MONGODB_COMPASS_AGGREGATIONS_TEST_BASE_PATH =
      initialAggregationsPath;
  });

  it('should read saved pipelines', async function () {
    let aggregations = await pipelineStorage.loadAll();
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

    aggregations = await pipelineStorage.loadAll();

    expect(aggregations).to.have.length(2);

    expect(aggregations[0]).to.have.property('lastModified');
    expect(aggregations[1]).to.have.property('lastModified');

    expect(aggregations[0].pipelineText).to.equal('[\n\n]');
    expect(aggregations[1].pipelineText).to.equal('[\n\n]');

    // Remove lastModified
    aggregations.map((x) => {
      delete x.lastModified;
      delete x.pipelineText;
      return x;
    });

    expect(aggregations.find((x) => x.id === data[0].id)).to.deep.equal(
      data[0]
    );
    expect(aggregations.find((x) => x.id === data[1].id)).to.deep.equal(
      data[1]
    );
  });

  it('should update a pipeline', async function () {
    const data = {
      id: 1234567890,
      name: 'hello',
      namespace: 'airbnb.users',
    };
    createPipeline(tmpDir, data);

    let aggregations = await pipelineStorage.loadAll();

    expect(aggregations).to.have.length(1);
    // loads lastModified from the file stats as well.
    delete aggregations[0].lastModified;
    delete aggregations[0].pipelineText;
    expect(aggregations[0]).to.deep.equal(data);

    const updatedAggregation = await pipelineStorage.updateAttributes(data.id, {
      name: 'updated',
      namespace: 'airbnb.users',
    });

    aggregations = await pipelineStorage.loadAll();
    expect(aggregations).to.have.length(1);
    delete aggregations[0].lastModified;
    delete aggregations[0].pipelineText;
    expect(aggregations[0], 'updates in storage').to.deep.equal({
      ...data,
      name: 'updated',
    });

    delete updatedAggregation.lastModified;
    delete updatedAggregation.pipelineText;
    expect(updatedAggregation, 'returns updated pipeline').to.deep.equal({
      ...data,
      name: 'updated',
    });
  });

  it('should delete a pipeline', async function () {
    const data = {
      id: 1234567890,
      name: 'hello',
    };
    createPipeline(tmpDir, data);

    let aggregations = await pipelineStorage.loadAll();

    expect(aggregations).to.have.length(1);
    expect(aggregations[0].id).to.equal(data.id);
    expect(aggregations[0].name).to.equal(data.name);

    await pipelineStorage.delete(data.id);

    aggregations = await pipelineStorage.loadAll();
    expect(aggregations).to.have.length(0);
  });
});
