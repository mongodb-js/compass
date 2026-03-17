import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { expect } from 'chai';
import { pipelines as PipelineFixtures } from '../test/fixtures/index';
import { createElectronPipelineStorage } from './storage-factories';

const getEnsuredFilePath = async (tmpDir: string, fileId: string) => {
  await fs.mkdir(path.join(tmpDir, 'SavedPipelines'), { recursive: true });
  return path.join(tmpDir, 'SavedPipelines', `${fileId}.json`);
};

const createPipeline = async (
  tmpDir: string,
  data: { id: string; name: string; namespace: string }
) => {
  const filePath = await getEnsuredFilePath(tmpDir, data.id);
  await fs.writeFile(filePath, JSON.stringify(data));
};

describe('CompassPipelineStorage', function () {
  let tmpDir: string;
  let pipelineStorage: ReturnType<typeof createElectronPipelineStorage>;

  beforeEach(async function () {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'saved-pipelines-tests'));
    pipelineStorage = createElectronPipelineStorage({ basepath: tmpDir });
  });

  afterEach(async function () {
    await fs.rm(tmpDir, { recursive: true });
  });

  it('reads saved pipelines', async function () {
    let aggregations = await pipelineStorage.loadAll();
    expect(aggregations).to.have.length(0);

    const data = [
      {
        id: '1234567',
        name: 'hello',
        namespace: 'db.hello',
      },
      {
        id: '7654321',
        name: 'world',
        namespace: 'db.hello',
      },
    ];
    await createPipeline(tmpDir, data[0]);
    await createPipeline(tmpDir, data[1]);

    aggregations = await pipelineStorage.loadAll();

    expect(aggregations).to.have.length(2);

    expect(aggregations[0]).to.have.property('lastModified');
    expect(aggregations[1]).to.have.property('lastModified');

    expect(aggregations[0].pipelineText).to.equal('[]');
    expect(aggregations[1].pipelineText).to.equal('[]');

    // Remove lastModified
    const mappedAggregations = aggregations.map((x) => {
      const { lastModified, pipelineText, ...rest } = x;
      return rest;
    });

    expect(mappedAggregations.find((x) => x.id === data[0].id)).to.deep.equal(
      data[0]
    );
    expect(mappedAggregations.find((x) => x.id === data[1].id)).to.deep.equal(
      data[1]
    );
  });

  it('createOrUpdate - creates a pipeline if it does not exist', async function () {
    const data = {
      id: '123456789876',
      name: 'airbnb listings',
      namespace: 'airbnb.listings',
      pipelineText: JSON.stringify([{ $match: { name: 'bas' } }]),
    };

    try {
      await fs.access(await getEnsuredFilePath(tmpDir, data.id));
      expect.fail('Expected file to not exist');
    } catch (e) {
      expect((e as NodeJS.ErrnoException).code).to.equal('ENOENT');
    }

    const result = await pipelineStorage.createOrUpdate(data.id, data);

    // Verify the file exists
    await fs.access(await getEnsuredFilePath(tmpDir, data.id));

    expect(result).to.be.true;
  });

  it('createOrUpdate - updates a pipeline if it exists', async function () {
    const data = {
      id: '123456789876',
      name: 'airbnb listings',
      namespace: 'airbnb.listings',
      pipelineText: JSON.stringify([{ $match: { name: 'bas' } }]),
    };

    await createPipeline(tmpDir, data);
    await fs.access(await getEnsuredFilePath(tmpDir, data.id));

    const result = await pipelineStorage.createOrUpdate(data.id, {
      ...data,
      name: 'modified listings',
    });

    expect(result).to.be.true;
  });

  it('updateAttributes - updates a pipeline if it exists', async function () {
    const data = {
      id: '1234567890',
      name: 'hello',
      namespace: 'airbnb.users',
    };
    await createPipeline(tmpDir, data);

    {
      const aggregations = await pipelineStorage.loadAll();
      expect(aggregations).to.have.length(1);
      // loads lastModified from the file stats as well.
      const { lastModified, pipelineText, ...restOfAggregation } =
        aggregations[0];
      expect(restOfAggregation).to.deep.equal(data);
    }
    const result = await pipelineStorage.updateAttributes(data.id, {
      name: 'updated',
      namespace: 'airbnb.users',
    });

    expect(result).to.be.true;

    {
      const aggregations = await pipelineStorage.loadAll();
      expect(aggregations).to.have.length(1);
      const { lastModified, pipelineText, ...restOfAggregation } =
        aggregations[0];
      expect(restOfAggregation, 'updates in storage').to.deep.equal({
        ...data,
        name: 'updated',
      });
    }
  });

  it('supports legacy pipeline array option', async function () {
    const data = {
      id: '1234567890',
      name: 'hello',
      namespace: 'airbnb.users',
      pipeline: [
        {
          stageOperator: '$match',
          stage: JSON.stringify({
            name: 'berlin',
          }),
          isEnabled: true,
        },
        {
          stageOperator: '$limit',
          stage: JSON.stringify(10),
          isEnabled: true,
        },
      ],
    };
    await createPipeline(tmpDir, data);

    const aggregations = await pipelineStorage.loadAll();

    expect(aggregations).to.have.lengthOf(1);
    expect(aggregations[0].id).to.equal(data.id);
    expect(aggregations[0]).to.not.have.property('pipeline');
    expect(aggregations[0]).to.have.property(
      'pipelineText',
      '[\n  {\n    $match: { name: "berlin" }\n  },\n  {\n    $limit: 10\n  }\n]'
    );
  });

  it('deletes a pipeline', async function () {
    const data = {
      id: '1234567890',
      name: 'hello',
      namespace: 'airbnb.users',
    };
    await createPipeline(tmpDir, data);

    let aggregations = await pipelineStorage.loadAll();

    expect(aggregations).to.have.length(1);
    expect(aggregations[0].id).to.equal(data.id);
    expect(aggregations[0].name).to.equal(data.name);

    await pipelineStorage.delete(data.id);

    aggregations = await pipelineStorage.loadAll();
    expect(aggregations).to.have.length(0);
  });

  for (const { version, data: pipeline } of PipelineFixtures) {
    it(`supports saved pipelines from Compass v${version}`, async function () {
      await createPipeline(tmpDir, pipeline);

      const savedPipeline = (await pipelineStorage.loadAll()).find(
        (x) => x.id === pipeline.id
      );

      expect(savedPipeline).to.exist;

      expect(savedPipeline).to.have.property('name', pipeline.name);
      expect(savedPipeline).to.have.property('namespace', pipeline.namespace);

      expect(savedPipeline).to.not.have.property('pipeline');
      expect(savedPipeline).to.have.property('pipelineText');
    });
  }
});
