import { expect } from 'chai';
import { PipelinePreviewManager } from './pipeline-preview-manager';
import { mockDataService } from './test/data-service';

describe('PipelinePreviewManager', function () {
  it('cancels an existing request', async function () {
    const { spies, dataService } = mockDataService({ data: [] });
    const previewManager = new PipelinePreviewManager(dataService);

    void previewManager.getPreviewForStage(
      0,
      'airbnb.listings',
      [{ $limit: 20 }],
      {},
    );
    // One inflight request and nothing in DataService called yet
    expect(previewManager['queue'].size).to.equal(1);
    expect(spies.startSession.callCount).to.equal(0);
    expect(spies.aggregate.callCount).to.equal(0);
    expect(spies.killSessions.callCount).to.equal(0);
    expect(spies.cursorToArray.callCount).to.equal(0);
    expect(spies.cursorClose.callCount).to.equal(0);

    await previewManager.getPreviewForStage(
      0,
      'airbnb.listings',
      [{ $limit: 20 }],
      {},
    );
    expect(previewManager['queue'].size).to.equal(0);
    expect(spies.startSession.callCount).to.equal(1);
    expect(spies.aggregate.callCount).to.equal(1);
    expect(spies.cursorToArray.callCount).to.equal(1);
  });
  it('clears the queue', function () {
    const { spies, dataService } = mockDataService({ data: [] });
    const previewManager = new PipelinePreviewManager(dataService);

    void previewManager.getPreviewForStage(
      0,
      'airbnb.listings',
      [{ $limit: 20 }],
      {},
    );
    void previewManager.getPreviewForStage(
      1,
      'airbnb.listings',
      [{ $limit: 20 }, { $skip: 10 }],
      {},
    );

    expect(previewManager['queue'].size).to.equal(2);

    previewManager.clearQueue();

    expect(previewManager['queue'].size).to.equal(0);
    expect(spies.startSession.callCount).to.equal(0);
    expect(spies.aggregate.callCount).to.equal(0);
    expect(spies.killSessions.callCount).to.equal(0);
    expect(spies.cursorToArray.callCount).to.equal(0);
    expect(spies.cursorClose.callCount).to.equal(0);
  });
});
