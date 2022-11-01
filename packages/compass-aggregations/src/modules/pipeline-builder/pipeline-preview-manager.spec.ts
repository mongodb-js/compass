import { expect } from 'chai';
import { mockDataService } from '../../../test/mocks/data-service';
import {
  createPreviewAggregation,
  DEFAULT_PREVIEW_LIMIT,
  DEFAULT_SAMPLE_SIZE,
  PipelinePreviewManager
} from './pipeline-preview-manager';

describe('PipelinePreviewManager', function () {
  it('should return pipeline results', async function () {
    const dataService = mockDataService({ data: [{ foo: 'bar' }] });
    const previewManager = new PipelinePreviewManager(dataService);
    expect(
      await previewManager.getPreviewForStage(0, 'test.test', [], {
        debounceMs: 10
      })
    ).to.deep.eq([{ foo: 'bar' }]);
  });

  it('should throw a cancelled error if preview request was cancelled', async function () {
    const dataService = mockDataService({ data: [] });
    const previewManager = new PipelinePreviewManager(dataService);

    const result = await Promise.allSettled([
      previewManager.getPreviewForStage(0, 'test.test', []),
      previewManager.cancelPreviewForStage(0)
    ]);

    expect(result[0]).to.have.property('status', 'rejected');
    expect(result[0]).to.have.nested.property(
      'reason.name',
      'PromiseCancelledError'
    );
  });

  it('should debounce aggregation calls for the same stage', async function () {
    const dataService = mockDataService({ data: [] });
    const previewManager = new PipelinePreviewManager(dataService);

    void previewManager.getPreviewForStage(0, 'test.test', [], {
      debounceMs: 10
    });
    void previewManager.getPreviewForStage(0, 'test.test', [], {
      debounceMs: 10
    });

    await previewManager.getPreviewForStage(0, 'test.test', [], {
      debounceMs: 10
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(dataService.aggregate).to.have.been.calledOnce;
  });

  it('should make aggregation calls for multiple stages', async function () {
    const dataService = mockDataService({ data: [] });
    const previewManager = new PipelinePreviewManager(dataService);

    await Promise.allSettled([
      previewManager.getPreviewForStage(0, 'test.test', [], {
        debounceMs: 0
      }),
      previewManager.getPreviewForStage(1, 'test.test', [], {
        debounceMs: 0
      }),
      previewManager.getPreviewForStage(2, 'test.test', [], {
        debounceMs: 0
      })
    ]);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(dataService.aggregate).to.have.been.calledThrice;
  });

  it('should cancel preview fetch for a stage', function () {
    const dataService = mockDataService({ data: [] });
    const previewManager = new PipelinePreviewManager(dataService);

    void previewManager.getPreviewForStage(0, 'test.test', []);

    expect(previewManager.cancelPreviewForStage(0)).to.eq(true);
  });

  it('should clear the queue starting from the index', async function () {
    const dataService = mockDataService({ data: [] });
    const previewManager = new PipelinePreviewManager(dataService);

    await Promise.allSettled([
      previewManager.getPreviewForStage(0, 'test.test', [], {
        debounceMs: 10
      }),
      previewManager.getPreviewForStage(1, 'test.test', []),
      previewManager.getPreviewForStage(2, 'test.test', []),
      previewManager.getPreviewForStage(3, 'test.test', []),
      previewManager.getPreviewForStage(4, 'test.test', []),
      previewManager.clearQueue(1)
    ]);

    // Only pipeline for stage 0 was executed
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(dataService.aggregate).to.have.been.calledOnce;
  });

  describe('createPreviewAggregation', function () {
    it('should add a limit stage at the end of the pipeline', function () {
      expect(createPreviewAggregation([])).to.deep.eq([
        { $limit: DEFAULT_PREVIEW_LIMIT }
      ]);
    });

    it('should not add a limit stage at the end of the pipeline if last stage is required as first stage', function () {
      expect(createPreviewAggregation([{ $indexStats: {} }])).to.deep.eq([
        { $indexStats: {} }
      ]);
    });

    it('should prepend full scan stages with limit', function () {
      expect(
        createPreviewAggregation([{ $group: {} }, { $bucket: {} }])
      ).to.deep.eq([
        { $limit: DEFAULT_SAMPLE_SIZE },
        { $group: {} },
        { $limit: DEFAULT_SAMPLE_SIZE },
        { $bucket: {} },
        { $limit: DEFAULT_PREVIEW_LIMIT }
      ]);
    });

    it('should not prepend full scan stages with limit if total document size is smaller than sample size', function () {
      expect(
        createPreviewAggregation([{ $group: {} }, { $bucket: {} }], {
          totalDocumentCount: 10
        })
      ).to.deep.eq([
        { $group: {} },
        { $bucket: {} },
        { $limit: DEFAULT_PREVIEW_LIMIT }
      ]);
    });

    it('should throw when last stage is output stage', function () {
      const pipeline = [
        { $match: {} },
        { $sort: {} },
        { $out: 'test' },
      ];
      expect(
        () => {
          createPreviewAggregation(pipeline)
        }
      ).to.throw;
    });

    it('should not throw when output stage is not at the end of pipeline', function () {
      const pipeline = [
        { $match: {} },
        { $out: 'test' },
        { $sort: {} },
      ];
      expect(
        createPreviewAggregation(pipeline)
      ).to.deep.eq([
        { $match: {} },
        { $out: 'test' },
        { $sort: {} },
        { $limit: DEFAULT_PREVIEW_LIMIT }
      ]);
    });
  });
});
