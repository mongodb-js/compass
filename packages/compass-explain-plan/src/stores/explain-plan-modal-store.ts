/* eslint-disable no-console */
import type { Stage } from '@mongodb-js/explain-plan-helper';
import { ExplainPlan } from '@mongodb-js/explain-plan-helper';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model/provider';
import type { Action, AnyAction, Reducer } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import type { ExplainPlanModalServices, OpenExplainPlanModalEvent } from '.';
import {
  getChatStreamResponseFromAI,
  getStreamResponseFromDocsAI,
} from '@mongodb-js/compass-generative-ai';
import type { Document } from 'bson';
import type { AggregateOptions } from 'mongodb';
import { prettify } from '@mongodb-js/compass-editor';
import {
  toJSString,
  DEFAULT_FILTER,
  DEFAULT_SORT,
  DEFAULT_LIMIT,
  DEFAULT_SKIP,
  DEFAULT_PROJECT,
  DEFAULT_COLLATION,
  DEFAULT_MAX_TIME_MS,
} from 'mongodb-query-parser';
import { isEqual } from 'lodash';

export function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

export type SerializedExplainPlan = ReturnType<ExplainPlan['serialize']>;

enum ExplainPlanModalActionTypes {
  CloseExplainPlanModal = 'compass-explain-plan-modal/CloseExplainPlanModal',
  FetchExplainPlanModalLoading = 'compass-explain-plan-modal/FetchExplainPlanModalLoading',
  FetchExplainPlanModalSuccess = 'compass-explain-plan-modal/FetchExplainPlanModalSuccess',
  FetchExplainPlanModalError = 'compass-explain-plan-modal/FetchExplainPlanModalError',

  FetchAIAnalysisStarted = 'compass-explain-plan-modal/FetchAIAnalysisStarted',
  FetchAIAnalysisError = 'compass-explain-plan-modal/FetchAIAnalysisError',
  FetchAIAnalysisSuccess = 'compass-explain-plan-modal/FetchAIAnalysisSuccess',
  FetchAIAnalysisProgress = 'compass-explain-plan-modal/FetchAIAnalysisProgress',
}

type CloseExplainPlanModalAction = {
  type: ExplainPlanModalActionTypes.CloseExplainPlanModal;
};

type FetchExplainPlanModalLoadingAction = {
  type: ExplainPlanModalActionTypes.FetchExplainPlanModalLoading;
  id: number;
};

type FetchExplainPlanModalSuccessAction = {
  type: ExplainPlanModalActionTypes.FetchExplainPlanModalSuccess;
  explainPlan: SerializedExplainPlan;
  rawExplainPlan: Document;
};

type FetchExplainPlanModalErrorAction = {
  type: ExplainPlanModalActionTypes.FetchExplainPlanModalError;
  error: string;
  rawExplainPlan: Document;
};

type FetchAIAnalysisStartedAction = {
  type: ExplainPlanModalActionTypes.FetchAIAnalysisStarted;
  id: number;
};

type FetchAIAnalysisErrorAction = {
  type: ExplainPlanModalActionTypes.FetchAIAnalysisError;
  error: string;
};

type FetchAIAnalysisSuccessAction = {
  type: ExplainPlanModalActionTypes.FetchAIAnalysisSuccess;
};

type FetchAIAnalysisProgressAction = {
  type: ExplainPlanModalActionTypes.FetchAIAnalysisProgress;
  chunk: string;
};

export type ExplainPlanModalState = {
  namespace: string;
  isDataLake: boolean;
  error: string | null;
  isModalOpen: boolean;
  status: 'initial' | 'loading' | 'ready' | 'error';
  explainPlan: SerializedExplainPlan | null;
  rawExplainPlan: Document | null;
  explainPlanFetchId: number;

  aiFetchId: number;
  aiFetchStatus: 'initial' | 'loading' | 'success' | 'error';
  aiAnalysisResponse: string | null;
  aiAnalysisError: string | null;
};

type ExplainPlanModalThunkAction<R, A extends Action = AnyAction> = ThunkAction<
  R,
  ExplainPlanModalState,
  ExplainPlanModalServices,
  A
>;

export const INITIAL_STATE: ExplainPlanModalState = {
  namespace: '',
  isDataLake: false,
  error: null,
  isModalOpen: false,
  status: 'initial',
  explainPlan: null,
  rawExplainPlan: null,
  explainPlanFetchId: -1,
  aiAnalysisError: null,
  aiFetchStatus: 'initial',
  aiAnalysisResponse: null,
  aiFetchId: -1,
};

export const reducer: Reducer<ExplainPlanModalState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  if (
    isAction<FetchAIAnalysisStartedAction>(
      action,
      ExplainPlanModalActionTypes.FetchAIAnalysisStarted
    )
  ) {
    return {
      ...state,
      aiFetchId: action.id,
      aiFetchStatus: 'loading',
      aiAnalysisError: null,
      aiAnalysisResponse: '',
    };
  }

  if (
    isAction<FetchAIAnalysisErrorAction>(
      action,
      ExplainPlanModalActionTypes.FetchAIAnalysisError
    )
  ) {
    return {
      ...state,
      aiFetchStatus: 'error',
      aiAnalysisError: action.error,
    };
  }

  if (
    isAction<FetchAIAnalysisProgressAction>(
      action,
      ExplainPlanModalActionTypes.FetchAIAnalysisProgress
    )
  ) {
    return {
      ...state,
      aiFetchStatus: 'loading',
      aiAnalysisResponse: (state.aiAnalysisResponse ?? '') + action.chunk,
    };
  }

  if (
    isAction<FetchAIAnalysisSuccessAction>(
      action,
      ExplainPlanModalActionTypes.FetchAIAnalysisSuccess
    )
  ) {
    return {
      ...state,
      aiFetchStatus: 'success',
      // TODO: anything to indicate it's done?
    };
  }

  if (
    isAction<FetchExplainPlanModalLoadingAction>(
      action,
      ExplainPlanModalActionTypes.FetchExplainPlanModalLoading
    )
  ) {
    return {
      ...state,
      isModalOpen: true,
      status: 'loading',
      error: null,
      explainPlan: null,
      rawExplainPlan: null,
      explainPlanFetchId: action.id,
    };
  }

  if (
    isAction<FetchExplainPlanModalSuccessAction>(
      action,
      ExplainPlanModalActionTypes.FetchExplainPlanModalSuccess
    )
  ) {
    return {
      ...state,
      status: 'ready',
      explainPlan: action.explainPlan,
      rawExplainPlan: action.rawExplainPlan,
      explainPlanFetchId: -1,

      aiFetchStatus: 'initial',
      aiAnalysisResponse: null,
      aiAnalysisError: null,
    };
  }

  if (
    isAction<FetchExplainPlanModalErrorAction>(
      action,
      ExplainPlanModalActionTypes.FetchExplainPlanModalError
    )
  ) {
    return {
      ...state,
      status: 'error',
      explainPlan: null,
      error: action.error,
      rawExplainPlan: action.rawExplainPlan,
      explainPlanFetchId: -1,
    };
  }

  if (
    isAction<CloseExplainPlanModalAction>(
      action,
      ExplainPlanModalActionTypes.CloseExplainPlanModal
    )
  ) {
    return {
      ...state,
      // We don't reset the state completely so that the closing modal content
      // doesn't jump during closing animation
      isModalOpen: false,
    };
  }

  return state;
};

const ExplainPlanAbortControllerMap = new Map<number, AbortController>();

let explainPlanFetchId = 0;

function getAbortSignal() {
  const id = ++explainPlanFetchId;
  const controller = new AbortController();
  ExplainPlanAbortControllerMap.set(id, controller);
  return { id, signal: controller.signal };
}

function abort(id: number) {
  const controller = ExplainPlanAbortControllerMap.get(id);
  controller?.abort();
  return ExplainPlanAbortControllerMap.delete(id);
}

function cleanupAbortSignal(id: number) {
  return ExplainPlanAbortControllerMap.delete(id);
}

const isOutputStage = (stage: unknown): boolean => {
  return (
    Object.prototype.hasOwnProperty.call(stage, '$out') ||
    Object.prototype.hasOwnProperty.call(stage, '$merge')
  );
};

// TODO: this is a hack and we shouldn't do this.
let isQuery = true;
let query: Record<string, unknown> | undefined;
type AggregationType = {
  pipeline: Document[];
  collation?: AggregateOptions['collation'];
  maxTimeMS?: number;
};
let aggregation: AggregationType | undefined;

function promptSampleDocsSection(sampleDocument?: string): string {
  return sampleDocument
    ? `
A sample document from the collection:
${sampleDocument} 
`
    : '';
}

function promptHeaderSection(operation: 'query' | 'aggregation'): string {
  return `
You are a MongoDB expert that analyzes the results of explain plans.
You are given an explain plan resulting from a ${operation} a user has run.
Provide a detailed and concise analysis drawn from the result of the explain plan to show directly to the user.
Do not mention obvious things. Keep it concise and to the point.
See if there are any ${operation} improvement suggestions to give to the user, however, don't over-advise.
They are already provided the explain plan result, so you don't need to repeat it.

Rules:
1. This will be shown directly to the user, keep your response concise.
2. Format for quick and crisp readability.
3. Do NOT include any meta information or conversational jargon. Include ONLY the analysis.
4. You are NOT a chatbot, don't use conversational language, there will be no follow ups.
5. Respond in markdown format. GitHub Flavored Markdown is preferred.
6. Do NOT include a header in your response, we already provide one.
7. You must NOT wrap the markdown with \`\`\`text or \`\`\`markdown. It is already wrapped.`;
}

// 4. Do NOT answer in a conversational tone, provide only the analysis to be shown to the user, meaning DO NOT say something like "Okay, let's look at this", only provide the analysis.

function buildSystemPrompt(operation: 'query' | 'aggregation'): string {
  return promptHeaderSection(operation);
}

// cannot read properties of undefined (reading 'inTable')

function explainPlanPromptSection(explainPlan: Document): string {
  return `
The explain plan result:
${prettify(JSON.stringify(explainPlan), 'json')}`;
}

function operationPromptSection({
  operation,
  aggregation,
  query,
}: {
  operation: 'query' | 'aggregation';
  query?: Record<string, unknown>;
  aggregation?: AggregationType;
}): string {
  if (
    operation === 'aggregation' &&
    (!aggregation || !aggregation.pipeline || aggregation.pipeline.length === 0)
  ) {
    return '';
  }

  if (operation === 'query' && (!query || Object.keys(query).length === 0)) {
    return '';
  }

  return `

The ${operation} is as follows:
${toJSString(
  operation === 'query'
    ? query
    : Object.keys(aggregation ?? {}).length === 1
    ? aggregation?.pipeline
    : aggregation
)}
`;
}

// function explainWithDocsChatbotPrompt({
//   operation,
//   rawExplainPlan,
//   aggregation,
//   query,
// }: {
//   operation: 'query' | 'aggregation';
//   query?: Record<string, unknown>;
//   aggregation?: AggregationType;
//   rawExplainPlan: Document;
// }) {
//   return `
// After running an operation with an explain, I want to understand the MongoDB explain result.
// Please describe it.
// No need for conversation jargon and don't make it conversational, just an analysis to help someone understand.
// I'll copy paste what you say to the user.
// ${operationPromptSection({
//   operation,
//   aggregation,
//   query,
// })}
// ${explainPlanPromptSection(rawExplainPlan)}}
// `;
// }
// No need for conversation jargon, a fancy response, or meta information, just an analysis to help someone understand.

function buildUserPrompt({
  operation,
  rawExplainPlan,
  aggregation,
  query,
  sampleDocument,
}: {
  operation: 'query' | 'aggregation';
  query?: Record<string, unknown>;
  aggregation?: AggregationType;
  rawExplainPlan: Document;
  sampleDocument?: string;
}): string {
  return `
${operationPromptSection({
  operation,
  aggregation,
  query,
})}
${explainPlanPromptSection(rawExplainPlan)}}

${promptSampleDocsSection(sampleDocument)}
`;
}

// TODO: This is a bad copy paste and should be shared with query bar (probably from somewhere else)
/*
 * Default values for the query bar form inputs
 */
const DEFAULT_FIELD_VALUES = {
  filter: undefined,
  project: undefined,
  collation: undefined,
  sort: undefined,
  hint: undefined,
  skip: undefined,
  limit: undefined,
  maxTimeMS: undefined,
} as const;

/**
 * Default values as will be returned from query parser during validation
 */
const DEFAULT_QUERY_VALUES = {
  filter: DEFAULT_FILTER,
  project: DEFAULT_PROJECT,
  collation: DEFAULT_COLLATION,
  sort: DEFAULT_SORT,
  hint: null,
  skip: DEFAULT_SKIP,
  limit: DEFAULT_LIMIT,
  maxTimeMS: DEFAULT_MAX_TIME_MS,
} as const;

function isQueryProperty(
  property: string
): property is keyof typeof DEFAULT_QUERY_VALUES {
  return Object.prototype.hasOwnProperty.call(DEFAULT_QUERY_VALUES, property);
}
function isFieldProperty(
  property: string
): property is keyof typeof DEFAULT_FIELD_VALUES {
  return Object.prototype.hasOwnProperty.call(DEFAULT_FIELD_VALUES, property);
}
function isFieldOrQueryProperty(
  property: string
): property is
  | keyof typeof DEFAULT_QUERY_VALUES
  | keyof typeof DEFAULT_FIELD_VALUES {
  return isQueryProperty(property) || isFieldProperty(property);
}

export function getNonDefaultValuesOfQuery(
  query: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!query) {
    return undefined;
  }

  const cleanedUpQuery: Record<string, unknown> = {};
  Object.keys(query).forEach((key) => {
    if (
      !isFieldOrQueryProperty(key) ||
      (!isEqual(query[key], DEFAULT_QUERY_VALUES[key]) &&
        !isEqual(query[key], DEFAULT_FIELD_VALUES[key]))
    ) {
      cleanedUpQuery[key] = query[key];
    }
  });
  return Object.keys(cleanedUpQuery).length > 0 ? cleanedUpQuery : undefined;
}

export function getNonDefaultValuesOfAggregation(
  aggregation: AggregationType | undefined
): AggregationType | undefined {
  if (!aggregation) {
    return undefined;
  }

  const cleanedUpAggregation: AggregationType = {
    pipeline: aggregation.pipeline,
    ...(!aggregation.collation || aggregation.collation === DEFAULT_COLLATION
      ? {}
      : { collation: aggregation.collation }),
    ...(aggregation.maxTimeMS === undefined ||
    aggregation.maxTimeMS === null ||
    aggregation.maxTimeMS === DEFAULT_MAX_TIME_MS
      ? {}
      : { maxTimeMS: aggregation.maxTimeMS }),
  };

  return Object.keys(cleanedUpAggregation).length > 0
    ? cleanedUpAggregation
    : undefined;
}

export function generateAIAnalysis(): ExplainPlanModalThunkAction<
  Promise<void>
> {
  return async (dispatch, getState) => {
    const { aiFetchId: existingFetchId, rawExplainPlan } = getState();

    console.log('aaa generateAIAnalysis called');

    // Abort any ongoing AI analysis
    abort(existingFetchId);

    const abortController = new AbortController();
    const { signal } = abortController;
    dispatch({
      type: ExplainPlanModalActionTypes.FetchAIAnalysisStarted,
      id: ++explainPlanFetchId,
    });

    if (!rawExplainPlan) {
      dispatch({
        type: ExplainPlanModalActionTypes.FetchAIAnalysisError,
        error: 'No explain plan available.',
      });
      return;
    }

    const operation = isQuery ? 'query' : 'aggregation';
    const cleanedUpQuery = getNonDefaultValuesOfQuery(query);
    const cleanedUpAggregation = getNonDefaultValuesOfAggregation(aggregation);

    const userPrompt = buildUserPrompt({
      operation,
      rawExplainPlan,
      query: cleanedUpQuery,
      aggregation: cleanedUpAggregation,
    });
    const systemPrompt = buildSystemPrompt(operation);
    console.log('aaa AI analysis prompt system:', systemPrompt);

    console.log('aaa AI analysis prompt user:', userPrompt);
    const aiAnalysisStream = getChatStreamResponseFromAI({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      signal,
    });

    // const DOCS_CHATBOT_MESSAGE_SIZE_LIMIT = 2000;
    // const docsAIUserPrompt = explainWithDocsChatbotPrompt({
    //   operation,
    //   rawExplainPlan,
    //   aggregation,
    //   query,
    // }).slice(0, DOCS_CHATBOT_MESSAGE_SIZE_LIMIT);
    // console.log('aaa AI analysis docs prompt:', docsAIUserPrompt);
    // const aiAnalysisStream = await getStreamResponseFromDocsAI({
    //   message: docsAIUserPrompt,
    //   signal,
    // });

    let fullResponse = '';
    try {
      for await (const chunk of aiAnalysisStream) {
        if (signal.aborted) {
          return;
        }
        if (fullResponse.length > 100000) {
          // When it's too long abort.
          abortController.abort();
        }
        // console.log('aaa chunk a a received:', chunk);
        // console.log(chunk); // Log each streamed chunk
        fullResponse += chunk; // Accumulate the response
        dispatch({
          type: ExplainPlanModalActionTypes.FetchAIAnalysisProgress,
          chunk,
        });
      }
      // console.log('aaa Full response:', fullResponse);
    } catch (error) {
      console.error('aaa Failed to stream ai response:', error);
      dispatch({
        type: ExplainPlanModalActionTypes.FetchAIAnalysisError,
        error: (error as Error).message,
      });
      return;
    }

    console.log('aaa ai analysis complete, full response:\n', fullResponse);

    dispatch({
      type: ExplainPlanModalActionTypes.FetchAIAnalysisSuccess,
    });
  };
}

export const openExplainPlanModal = (
  event: OpenExplainPlanModalEvent
): ExplainPlanModalThunkAction<Promise<void>> => {
  return async (
    dispatch,
    getState,
    {
      dataService,
      preferences,
      track,
      connectionInfoRef,
      logger: { log, mongoLogId },
    }
  ) => {
    const { id: fetchId, signal } = getAbortSignal();

    const connectionInfo = connectionInfoRef.current;

    let rawExplainPlan = null;
    let explainPlan = null;

    dispatch({
      type: ExplainPlanModalActionTypes.FetchExplainPlanModalLoading,
      id: fetchId,
    });

    const { isDataLake, namespace } = getState();

    const explainVerbosity = isDataLake
      ? 'queryPlannerExtended'
      : 'executionStats';

    try {
      if (event.aggregation) {
        isQuery = false;
        aggregation = event.aggregation;
        const { collation, maxTimeMS } = event.aggregation;
        const pipeline = event.aggregation.pipeline.filter((stage) => {
          // Getting explain plan for a pipeline with an out / merge stage can
          // cause data corruption issues in non-genuine MongoDB servers, for
          // example CosmosDB actually executes pipeline and persists data, even
          // when the stage is not at the end of the pipeline. To avoid
          // introducing branching logic based on MongoDB genuineness, we just
          // filter out all output stages here instead
          return !isOutputStage(stage);
        });

        const explainOptions = {
          maxTimeMS: capMaxTimeMSAtPreferenceLimit(
            preferences,
            maxTimeMS ?? DEFAULT_MAX_TIME_MS
          ),
        };

        rawExplainPlan = await dataService.explainAggregate(
          namespace,
          pipeline,
          { ...explainOptions, collation },
          { explainVerbosity, abortSignal: signal }
        );

        try {
          explainPlan = new ExplainPlan(rawExplainPlan as Stage).serialize();
        } catch (err) {
          log.warn(
            mongoLogId(1_001_000_137),
            'Explain',
            'Failed to parse aggregation explain',
            { message: (err as Error).message }
          );
          throw err;
        }

        track(
          'Aggregation Explained',
          {
            num_stages: pipeline.length,
            index_used: explainPlan.usedIndexes.length > 0,
          },
          connectionInfo
        );
      }

      if (event.query) {
        isQuery = true;
        query = event.query;
        const { filter, ...options } = event.query;

        const explainOptions = {
          ...options,
          maxTimeMS: capMaxTimeMSAtPreferenceLimit(
            preferences,
            options.maxTimeMS ?? DEFAULT_MAX_TIME_MS
          ),
        };

        rawExplainPlan = await dataService.explainFind(
          namespace,
          filter,
          explainOptions,
          { explainVerbosity, abortSignal: signal }
        );

        try {
          explainPlan = new ExplainPlan(rawExplainPlan as Stage).serialize();
        } catch (err) {
          log.warn(
            mongoLogId(1_001_000_192),
            'Explain',
            'Failed to parse find explain',
            { message: (err as Error).message }
          );
          throw err;
        }

        track(
          'Explain Plan Executed',
          {
            with_filter: Object.entries(filter).length > 0,
            index_used: explainPlan.usedIndexes.length > 0,
          },
          connectionInfo
        );
      }

      dispatch({
        type: ExplainPlanModalActionTypes.FetchExplainPlanModalSuccess,
        explainPlan,
        rawExplainPlan,
      });
    } catch (err) {
      if (dataService.isCancelError(err)) {
        // Cancellation can be caused only by close modal action and handled
        // there
        return;
      }
      log.error(mongoLogId(1_001_000_138), 'Explain', 'Failed to run explain', {
        message: (err as Error).message,
      });
      dispatch({
        type: ExplainPlanModalActionTypes.FetchExplainPlanModalError,
        error: (err as Error).message,
        rawExplainPlan,
      });
    } finally {
      // Remove AbortController from the Map as we either finished waiting for
      // the fetch or cancelled at this point
      cleanupAbortSignal(fetchId);
    }
  };
};

export const abortAnyOngoingOp = (): ExplainPlanModalThunkAction<void> => {
  return (dispatch, getState) => {
    abort(getState().explainPlanFetchId);
    abort(getState().aiFetchId);
  };
};

export const closeExplainPlanModal = (): ExplainPlanModalThunkAction<void> => {
  return (dispatch, getState) => {
    abort(getState().explainPlanFetchId);
    dispatch({
      type: ExplainPlanModalActionTypes.CloseExplainPlanModal,
    });
  };
};

export const openCreateIndexModal = (): ExplainPlanModalThunkAction<void> => {
  return (_dispatch, _getState, { localAppRegistry }) => {
    localAppRegistry?.emit('open-create-index-modal');
  };
};
