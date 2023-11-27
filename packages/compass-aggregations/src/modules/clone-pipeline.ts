/**
 * Clone pipeline action name.
 */
export const CLONE_PIPELINE = 'aggregations/CLONE_PIPELINE' as const;

export interface ClonePipelineAction {
  type: typeof CLONE_PIPELINE;
}

/**
 * The clone pipeline action.
 */
export const clonePipeline = (): ClonePipelineAction => ({
  type: CLONE_PIPELINE,
});
