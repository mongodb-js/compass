import { expect } from 'chai';
import { executionStatsToTreeData } from './explain-tree-data';

describe('executionStatsToTreeData', function () {
  it('should return the correct tree data when given valid execution stats', function () {
    const executionStats = {
      executionStages: {
        stage: 'COLLSCAN',
        nReturned: 100,
        executionTimeMillis: 10,
        inputStages: [
          {
            stage: 'IXSCAN',
            nReturned: 50,
            executionTimeMillis: 5,
          },
        ],
      },
    };
    const treeData = executionStatsToTreeData(executionStats as any);
    expect(treeData).to.deep.equal({
      id: 'stage-0',
      name: 'COLLSCAN',
      nReturned: 100,
      curStageExecTimeMS: 10,
      prevStageExecTimeMS: 5,
      isShard: false,
      children: [
        {
          id: 'stage-1',
          name: 'IXSCAN',
          nReturned: 50,
          curStageExecTimeMS: 5,
          prevStageExecTimeMS: 0,
          isShard: false,
          children: [],
          details: {
            executionTimeMillis: 5,
            nReturned: 50,
            stage: 'IXSCAN',
          },
          highlights: {
            'Index Name': undefined,
            'Multi Key Index': undefined,
          },
        },
      ],
      details: {
        executionTimeMillis: 10,
        nReturned: 100,
        stage: 'COLLSCAN',
      },
      highlights: {
        'Documents Examined': undefined,
      },
    });
  });

  it('should calculate the prevStageExecTimeMS and curStageExecTimeMS correctly', function () {
    const executionStats = {
      executionStages: {
        executionTimeMillisEstimate: 20,
        inputStages: [
          {
            executionTimeMillisEstimate: 15,
            inputStages: [
              {
                executionTimeMillisEstimate: 5,
              },
            ],
          },
        ],
      },
    };

    const treeData = executionStatsToTreeData(executionStats as any);
    expect(treeData?.prevStageExecTimeMS).to.equal(15);
    expect(treeData?.curStageExecTimeMS).to.equal(20);

    expect(treeData?.children[0].prevStageExecTimeMS).to.equal(5);
    expect(treeData?.children[0].curStageExecTimeMS).to.equal(15);

    expect(treeData?.children[0].children[0].prevStageExecTimeMS).to.equal(0);
    expect(treeData?.children[0].children[0].curStageExecTimeMS).to.equal(5);
  });

  it('picks the max execution time of multiple input stages', function () {
    const executionStats = {
      executionStages: {
        executionTimeMillisEstimate: 20,
        inputStages: [
          {
            executionTimeMillisEstimate: 5,
          },
          {
            executionTimeMillisEstimate: 15,
          },
        ],
      },
    };

    const treeData = executionStatsToTreeData(executionStats as any);
    expect(treeData?.prevStageExecTimeMS).to.equal(15);
    expect(treeData?.curStageExecTimeMS).to.equal(20);
  });

  it('returns correct highlights for IXSCAN stage', function () {
    const executionStats = {
      executionStages: {
        stage: 'IXSCAN',
        indexName: 'test_index',
        isMultiKey: false,
      },
    };

    const treeData = executionStatsToTreeData(executionStats as any);

    expect(treeData?.highlights).to.deep.equal({
      'Index Name': 'test_index',
      'Multi Key Index': false,
    });
  });

  it('returns correct highlights for PROJECTION stage', function () {
    const executionStats = {
      executionStages: {
        stage: 'PROJECTION',
        transformBy: { field: 'value' },
      },
    };

    const treeData = executionStatsToTreeData(executionStats as any);

    expect(treeData?.highlights).to.deep.equal({
      'Transform by': '{"field":"value"}',
    });
  });

  it('returns correct highlights for COLLSCAN stage', function () {
    const executionStats = {
      executionStages: {
        stage: 'COLLSCAN',
        docsExamined: 100,
      },
    };

    const treeData = executionStatsToTreeData(executionStats as any);

    expect(treeData?.highlights).to.deep.equal({
      'Documents Examined': 100,
    });
  });

  it('returns an empty object if the stage name is unknown', function () {
    const executionStats = {
      executionStages: {
        stage: 'UNKNOWN_STAGE',
        indexName: 'test_index',
        isMultiKey: false,
        docsExamined: 100,
        transformBy: { field: 'value' },
      },
    };

    const treeData = executionStatsToTreeData(executionStats as any);

    expect(treeData?.highlights).to.deep.equal({});
  });

  it('returns isShard properly', function () {
    const shardInput = {
      executionStages: {
        shardName: 'shard1',
      },
    };

    const stageInput = {
      executionStages: {
        stage: 'stage1',
      },
    };

    expect(executionStatsToTreeData(shardInput as any)).to.have.property(
      'isShard',
      true
    );
    expect(executionStatsToTreeData(stageInput as any)).to.have.property(
      'isShard',
      false
    );
  });

  it('should return undefined when given invalid execution stats', function () {
    const executionStats = {};
    const treeData = executionStatsToTreeData(executionStats as any);
    expect(treeData).to.be.undefined;
  });
});
