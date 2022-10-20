import type { DataService } from 'mongodb-data-service';
import type { AggregateOptions, Document } from 'mongodb';
import { aggregatePipeline } from '../../utils/cancellable-aggregation';
import { cancellableWait } from '../../utils/cancellable-promise';
import { getStageOperator } from '../../utils/stage';

export const DEFAULT_SAMPLE_SIZE = 100000;

export const DEFAULT_PREVIEW_LIMIT = 10;

/**
 * Ops that must scan the entire results before moving to the
 * next stage.
 */
const FULL_SCAN_OPS = ['$group', '$groupBy', '$bucket', '$bucketAuto'];

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

export interface PreviewOptions extends AggregateOptions {
  debounceMs?: number;
  totalDocumentCount?: number;
  sampleSize?: number;
  previewSize?: number;
};

export function createPreviewAggregation(
  pipeline: Document[],
  options: Pick<
    PreviewOptions,
    'sampleSize' | 'previewSize' | 'totalDocumentCount'
  > = {}
) {
  const stages = [];
  for (const stage of pipeline) {
    if (
      (!options.totalDocumentCount ||
        options.totalDocumentCount >
          (options.sampleSize ?? DEFAULT_SAMPLE_SIZE)) &&
      // If stage can cause a full scan on the collection, prepend it with a
      // $limit
      FULL_SCAN_OPS.includes(getStageOperator(stage) ?? '')
    ) {
      stages.push({ $limit: options.sampleSize ?? DEFAULT_SAMPLE_SIZE });
    }
    stages.push(stage);
  }
  if (
    // TODO: super unsure what this is doing, half of these are not even
    // selectable stage operators in UI
    !REQUIRED_AS_FIRST_STAGE.includes(
      getStageOperator(stages[stages.length - 1]) ?? ''
    )
  ) {
    stages.push({ $limit: options.previewSize ?? DEFAULT_PREVIEW_LIMIT });
  }
  return stages;
}

export class PipelinePreviewManager {
  private queue = new Map<number, AbortController>();
  constructor(private dataService: DataService) {}
  /**
   * Request aggregation results with a default debounce
   */
  async getPreviewForStage(
    idx: number,
    namespace: string,
    pipeline: Document[],
    {
      sampleSize,
      previewSize,
      totalDocumentCount,
      ...options
    }: PreviewOptions = {},
    force = false
  ): Promise<Document[]> {
    this.queue.get(idx)?.abort();
    const controller = new AbortController();
    this.queue.set(idx, controller);
    if (!force) {
      await cancellableWait(options.debounceMs ?? 700, controller.signal);
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

  /**
   * Cancel aggregation request by id
   */
  cancelPreviewForStage(idx: number): boolean {
    this.queue.get(idx)?.abort();
    return this.queue.delete(idx);
  }

  /**
   * Clear request queue starting from an index
   */
  clearQueue(from = 0) {
    for (const [idx, controller] of Array.from(this.queue.entries())) {
      if (idx >= from) {
        controller.abort();
        this.queue.delete(idx);
      }
    }
  }
}
