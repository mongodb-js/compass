import type { DataService } from 'mongodb-data-service';
import type { AggregateOptions, Document } from 'mongodb';
import { aggregatePipeline } from '../../utils/cancellable-aggregation';
import { cancellableWait } from '@mongodb-js/compass-utils';
import {
  getStageOperator,
  getLastStageOperator,
  isLastStageOutputStage,
} from '../../utils/stage';
import {
  FULL_SCAN_STAGES,
  REQUIRED_AS_FIRST_STAGE,
} from '@mongodb-js/mongodb-constants';
import isEqual from 'lodash/isEqual';

export const DEFAULT_SAMPLE_SIZE = 100000;

export const DEFAULT_PREVIEW_LIMIT = 10;

/**
 * Ops that must scan the entire results before moving to the
 * next stage.
 */
const FULL_SCAN_OPS = FULL_SCAN_STAGES.map((stage) => stage.value) as string[];

/**
 * Stage operators that are required to be the first stage.
 */
const REQUIRED_AS_FIRST_STAGE_OPS = REQUIRED_AS_FIRST_STAGE.map(
  (stage) => stage.value
) as string[];

export interface PreviewOptions extends AggregateOptions {
  debounceMs?: number;
  totalDocumentCount?: number;
  sampleSize?: number;
  previewSize?: number;
}

export function createPreviewAggregation(
  pipeline: Document[],
  options: Pick<
    PreviewOptions,
    'sampleSize' | 'previewSize' | 'totalDocumentCount'
  > = {}
) {
  if (isLastStageOutputStage(pipeline)) {
    throw new Error('Cannot preview pipeline with last stage as output stage');
  }

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
    !REQUIRED_AS_FIRST_STAGE_OPS.includes(getLastStageOperator(stages))
  ) {
    stages.push({ $limit: options.previewSize ?? DEFAULT_PREVIEW_LIMIT });
  }
  return stages;
}

export class PipelinePreviewManager {
  private queue = new Map<number, AbortController>();
  private lastPipeline = new Map<number, Document[]>();
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
    this.lastPipeline.set(idx, pipeline);
    const result = await aggregatePipeline({
      dataService: this.dataService,
      signal: controller.signal,
      namespace,
      pipeline: createPreviewAggregation(pipeline, {
        sampleSize,
        previewSize,
        totalDocumentCount,
      }),
      options,
    });
    this.queue.delete(idx);
    return result;
  }

  isLastPipelineEqual(idx: number, pipeline: Document[]): boolean {
    return isEqual(pipeline, this.lastPipeline.get(idx));
  }

  /**
   * Cancel aggregation request by id
   */
  cancelPreviewForStage(idx: number): boolean {
    this.queue.get(idx)?.abort();
    this.lastPipeline.delete(idx);
    return this.queue.delete(idx);
  }

  /**
   * Clear request queue starting from an index
   */
  clearQueue(from = 0) {
    for (const [idx, controller] of Array.from(this.queue.entries())) {
      if (idx >= from) {
        controller.abort();
        this.lastPipeline.delete(idx);
        this.queue.delete(idx);
      }
    }
  }
}
