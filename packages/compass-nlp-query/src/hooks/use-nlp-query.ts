import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { DataService } from 'mongodb-data-service';

import { getMQLForNaturalLanguageText, parseMQLFromAIText } from '../util/natural-language-processing';
import type { ResultsViewType } from '../components/document-list';

export type TranslateState = 'empty' | 'awaiting-run' | 'loaded' | 'loading' | 'error';
export type ResultState = 'awaiting-run' | 'loaded' | 'loading' | 'error';

type NLPQueryState = {
  translateState: TranslateState;
  translateTimeMS: number;
  translateErrorMessage?: string;

  resultState: ResultState;
  resultErrorMessage?: string;

  mqlText: string;
  resultDocuments: Document[];
  resultsViewType: ResultsViewType;
}

type NLPQueryAction = {
  type: 'translate-empty';
  update: {
    translateState: 'empty';
    translateErrorMessage: undefined;
    resultState: 'awaiting-run';
  }
} | {
  type: 'ready-for-translate';
  update: {
    translateState: 'awaiting-run';
    translateErrorMessage: undefined;
    resultState: 'awaiting-run';
  }
} | {
  type: 'translate-loading';
  update: {
    translateState: 'loading';
    translateErrorMessage: undefined;
  }
} | {
  type: 'translate-complete';
  update: {
    mqlText: string;
    translateState: 'loaded';
    translateTimeMS: number;
  }
} | {
  type: 'translate-error';
  update: {
    translateErrorMessage: string;
    translateState: 'error';
  }
} | {
  type: 'results-loading';
  update: {
    resultErrorMessage: undefined;
    resultState: 'loading';
  }
} | {
  type: 'results-loaded';
  update: {
    resultDocuments: Document[];
    resultErrorMessage: undefined;
    resultState: 'loaded'
  }
} | {
  type: 'results-error';
  update: {
    resultErrorMessage: string;
    resultState: 'error'
  }
} | {
  type: 'set-results-view-type';
  update: {
    resultsViewType: ResultsViewType;
  }
} | {
  type: 'clear-error';
  update: {
    translateState: 'awaiting-run';
    resultState: 'awaiting-run';
  }
};

function reducer(
  state: NLPQueryState,
  action: NLPQueryAction
): NLPQueryState {
  return {
    ...state,
    ...action.update
  };
}

export function useNLPQuery({
  dataService,
  namespace,
  queryText,
}: {
  dataService: DataService;
  namespace: string;
  queryText: string;
}):[
  NLPQueryState,
  {
    onClearError: () => void;
    onTranslateQuery: () => Promise<void>;
    onRunQuery: () => Promise<void>;
    setResultsViewType: (viewType: ResultsViewType) => void;
  }
] {
  const [state, dispatch] = useReducer(
    reducer,
    {
      translateState: 'empty',
      translateTimeMS: 0,

      mqlText: '',
      resultDocuments: [],
      resultState: 'awaiting-run',
      resultsViewType: 'document'
    }
  );
  const {
    mqlText
  } = state;

  // TODO: We should have individual promises that are explicitly cancelled
  // on useEffect unmount instead of an `isMounted` flag probably.
  const isMounted = useRef(true);

  useEffect(() => {
    if (queryText) {
      dispatch({
        type: 'ready-for-translate',
        update: {
          translateState: 'awaiting-run',
          translateErrorMessage: undefined,
          resultState: 'awaiting-run'
        }
      })
    } else {
      dispatch({
        type: 'translate-empty',
        update: {
          translateState: 'empty',
          translateErrorMessage: undefined,
          resultState: 'awaiting-run'
        }
      });
    }
  }, [ queryText ]);


  const setResultsViewType = useCallback((viewType: ResultsViewType) => {
    dispatch({
      type: 'set-results-view-type',
      update: {
        resultsViewType: viewType
      }
    })
  }, []);

  const onClearError = useCallback(() => {
    dispatch({
      type: 'clear-error',
      update: {
        translateState: 'awaiting-run',
        resultState: 'awaiting-run'
      }
    })
  }, []);

  const onRunQuery = useCallback(async () => {
    // TODO: Cancel any previously running query if we're allowing for it
    // to be run when another could be still pending.

    dispatch({
      type: 'results-loading',
      update: {
        resultErrorMessage: undefined,
        resultState: 'loading'
      }
    });

    const startTime = Date.now();

    let aggregationPipeline;

    try {
      aggregationPipeline = parseMQLFromAIText(mqlText);
    } catch(e) {
      if (!isMounted) {
        return;
      }

      dispatch({
        type: 'results-error',
        update: {
          resultErrorMessage: ((e as Error)?.message) || `An error occurred when running the generated MongoDB aggregation ${e as string}`,
          resultState: 'error',
        }
      });
      return;
    }

    let documents: Document[];
    try {
      documents = await dataService.aggregate(
        namespace,
        aggregationPipeline
      ).limit(4).toArray();
    } catch (e) {
      if (!isMounted) {
        return;
      }

      dispatch({
        type: 'results-error',
        update: {
          resultErrorMessage: ((e as Error)?.message) || `An error occurred when running the generated MongoDB aggregation ${e as string}`,
          resultState: 'error',
        }
      });
      return;
    }

    if (!isMounted) {
      // We have unmounted, no need to continue to setting state.
      // TODO: See if we can cancel the open ai api request in progress
      // if we unmount during a call.
      return;
    }

    const endTime = Date.now();
    console.log('Took ', endTime - startTime, 'ms for results.');

    dispatch({
      type: 'results-loaded',
      update: {
        resultDocuments: documents,
        resultErrorMessage: undefined,
        resultState: 'loaded',
      }
    });
  }, [ dataService, namespace, mqlText ]);

  useEffect(() => {
    () => {
      isMounted.current = false;
    }
  }, []);

  const onTranslateQuery = useCallback(async () => {
    // TODO: Cancel any previously running translation.

    dispatch({
      type: 'translate-loading',
      update: {
        translateErrorMessage: undefined,
        translateState: 'loading'
      }
    });

    const startTime = Date.now();

    let mqlTextString;

    // 1s fake timer.
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    // const mqlTextString = 'db.aggregate([{$match: {}}])';

    try {
      mqlTextString = await getMQLForNaturalLanguageText(queryText);
    } catch(e) {
      if (!isMounted) {
        return;
      }

      dispatch({
        type: 'translate-error',
        update: {
          translateErrorMessage: ((e as Error)?.message) || `Unable to translate natural language to mql, error: ${e as string}`,
          translateState: 'error'
        }
      });
      return;
    }

    if (!isMounted) {
      // We have unmounted, no need to continue to setting state.
      // TODO: See if we can cancel the open ai api request in progress
      // if we unmount during a call. We also need to ensure two fetches can't
      // be going on at once (promise ref).
      return;
    }

    const endTime = Date.now();

    dispatch({
      type: 'translate-complete',
      update: {
        mqlText: mqlTextString,
        translateTimeMS: endTime - startTime,
        translateState: 'loaded',
      }
    });
  }, [ queryText ]);

  return [state, {
    onClearError,
    onTranslateQuery,
    onRunQuery,
    setResultsViewType
  }]
}


// Code for debounce on key type:


// We delay translating the user's query for this long after they've finished
// typing.
// const delayTranslateRequestMS = 1000;


  // const runNaturalTextToMQLTimeout = useRef<ReturnType<typeof setTimeout> | null>(
  //   null
  // );
  // const lastRunQueryText = useRef('');

  // When unmounting, cleanup any current debounce.
  // useEffect(() => {
  //   return () => {
  //     if (runNaturalTextToMQLTimeout.current) {
  //       clearTimeout(runNaturalTextToMQLTimeout.current);
  //       runNaturalTextToMQLTimeout.current = null;
  //     }
  //   };
  // }, []);

  // Every time queryText changes (user types) we debounce the running
  // of the mql generation. So once they stop typing for a bit the query
  // runs. (We debounce since it's expensive.)
  // useEffect(() => {
  //   if (runNaturalTextToMQLTimeout.current) {
  //     clearTimeout(runNaturalTextToMQLTimeout.current);
  //     runNaturalTextToMQLTimeout.current = null;
  //   }

  //   if (
  //     queryText
  //     && lastRunQueryText.current !== queryText
  //   ) {
  //     lastRunQueryText.current = queryText;

  //     runNaturalTextToMQLTimeout.current = setTimeout(() => {
  //       setMQLText(queryText);
  //       runNaturalTextToMQLTimeout.current = null;
  //     }, delayTranslateRequestMS);
  //   }
  // }, [queryText]);
