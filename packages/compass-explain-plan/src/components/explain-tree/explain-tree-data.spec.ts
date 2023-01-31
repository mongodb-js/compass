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

  it('should return undefined when given invalid execution stats', function () {
    const executionStats = {};
    const treeData = executionStatsToTreeData(executionStats as any);
    expect(treeData).to.be.undefined;
  });
});
