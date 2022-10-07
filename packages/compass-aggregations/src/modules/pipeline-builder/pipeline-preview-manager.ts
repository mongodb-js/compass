import type { DataService } from 'mongodb-data-service';
import type { AggregateOptions, Document } from 'mongodb';
import { aggregatePipeline } from '../../utils/cancellable-aggregation';
import { cancellableWait } from '../../utils/cancellable-promise';

/**
 * Ops that must scan the entire results before moving to the
 * next stage.
 */
const FULL_SCAN_OPS = ['$group', '$bucket', '$bucketAuto'];

/**
 * Stage operators that are required to be the first stage.
 */
const REQUIRED_AS_FIRST_STAGE = [
  '$collStats',
  '$currentOp',
  '$indexStats',
  '$listLocalSessions',
  '$listSessions'
];

function getStageOp(doc: Document): string {
  return Object.keys(doc)[0];
}

type PreviewOptions = {
  totalDocumentCount?: number;
  sampleSize: number;
  previewSize: number;
};

function createPreviewAggregation(
  pipeline: Document[],
  options: PreviewOptions
) {
  const stages = [];
  for (const stage of pipeline) {
    if (
      (!options.totalDocumentCount ||
        options.totalDocumentCount > options.sampleSize) &&
      FULL_SCAN_OPS.includes(getStageOp(stage))
    ) {
      stages.push({ $limit: options.sampleSize });
    }
    stages.push(stage);
  }
  if (
    // TODO: super unsure what this is doing, half of these are not even
    // selectable stage operators in UI
    !REQUIRED_AS_FIRST_STAGE.includes(getStageOp(stages[stages.length - 1]))
  ) {
    stages.push({ $limit: options.previewSize });
  }
  return stages;
}

export class PipelinePreviewManager {
  private queue = new Map<number, AbortController>();
  constructor(private dataService: DataService) {}
  async getPreviewForStage(
    idx: number,
    namespace: string,
    pipeline: Document[],
    {
      sampleSize,
      previewSize,
      totalDocumentCount,
      ...options
    }: AggregateOptions & PreviewOptions = {
      sampleSize: 10000,
      previewSize: 10
    },
    force = false
  ): Promise<Document[]> {
    this.queue.get(idx)?.abort();
    const controller = new AbortController();
    this.queue.set(idx, controller);
    if (!force) {
      await cancellableWait(700, controller.signal);
    }
    const result = await aggregatePipeline({
      dataService: this.dataService,
      signal: controller.signal,
      namespace,
      pipeline: createPreviewAggregation(pipeline, {
        sampleSize,
        previewSize,
        totalDocumentCount
      }),
      options
    });
    this.queue.delete(idx);
    return result;
  }
  cancelPreviewForStage(idx: number): boolean {
    this.queue.get(idx)?.abort();
    return this.queue.delete(idx);
  }
  clearQueue(from = 0) {
    for (const [idx, controller] of Array.from(this.queue.entries())) {
      if (idx >= from) {
        controller.abort();
        this.queue.delete(idx);
      }
    }
  }
}
