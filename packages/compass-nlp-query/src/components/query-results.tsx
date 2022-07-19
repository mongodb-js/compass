import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Banner, Body, Button, css, spacing, SpinLoader } from '@mongodb-js/compass-components';
import type { DataService } from 'mongodb-data-service';

import { ProposedQuery } from './proposed-query';
import { getMQLForNaturalLanguageText, parseMQLFromAIText } from '../util/natural-language-processing';
import { DocumentList } from './document-list';
import type { ResultsViewType } from './document-list';
import { DocumentResultsHeader } from './document-results-header';

const resultsContainerStyles = css({
  padding: spacing[2],
});

const translateButtonStyles = css({
  marginTop: spacing[2],
});

const loadingContainerStyles = css({
  padding: spacing[4],
});

const resultsHeaderStyles = css({
  paddingLeft: spacing[3] + spacing[1],
  paddingRight: spacing[5] + spacing[1],
});

const resultsStyles = css({
  height: '100%',
  overflowY: 'auto',
  '&:not(:first-child)': {
    height: `calc(100% - ${spacing[3]}px)`,
    marginTop: spacing[3]
  }
});

// We delay translating the user's query for this long after they've finished
// typing.
// const delayTranslateRequestMS = 1000;

type ResultState = 'empty' | 'awaiting-translate-run' | 'awaiting-mql-run' | 'loaded' | 'loading' | 'error';

type QueryResultsProps = {
  dataService: DataService;
  namespace: string;
  queryText: string;
};

function QueryResults({
  dataService,
  namespace,
  queryText
}: QueryResultsProps): React.ReactElement {
  const [ resultState, setResultState ] = useState<ResultState>('empty');
  const [ errorMessage, setErrorMessage ] = useState('');
  const [ mqlText, setMQLText ] = useState('');
  const [ resultDocuments, setResultDocuments ] = useState<Document[]>();
  const [ resultsViewType, setResultsViewType ] =
    useState<ResultsViewType>('document');
  const [ translateTimeMS, setTranslateTimeMS ] = useState(0);

  // TODO: We should have individual promises that are explicitly cancelled
  // on useEffect unmount instead of an `isMounted` flag probably.
  const isMounted = useRef(true);

  useEffect(() => {
    if (queryText) {
      setResultState('awaiting-translate-run');
    } else {
      setResultState('empty');
    }
  }, [ queryText ]);

  const onClickRunQuery = useCallback(async () => {
    setResultState('loading');

    const startTime = Date.now();

    let aggregationPipeline;

    try {
      aggregationPipeline = parseMQLFromAIText(mqlText);
    } catch(e) {
      if (!isMounted) {
        return;
      }

      setErrorMessage(
        ((e as Error)?.message) || `Unable to translate natural language to MongoDB aggregation ${e as string}`
      );
      setResultState('error');
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

      // TODO: One action for multiple state updates, not multiple state updates.
      setErrorMessage(
        ((e as Error)?.message) || `An error occurred when running the generated MongoDB aggregation ${e as string}`
      );
      setResultState('error');
      return;
    }

    if (!isMounted) {
      // We have unmounted, no need to continue to setting state.
      // TODO: See if we can cancel the open ai api request in progress
      // if we unmount during a call.
      return;
    }

    // const aggregationResultString = JSON.stringify(documents);

    const endTime = Date.now();
    console.log('Took ', endTime - startTime, 'ms for results.');

    // TODO: One action for multiple state updates, not multiple state updates.
    setResultState('loaded');
    setResultDocuments(documents);
  }, [ dataService, namespace, mqlText ]);

  const runNaturalTextToMQLTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  // const lastRunQueryText = useRef('');

  // When unmounting, cleanup any current debounce.
  useEffect(() => {
    return () => {
      if (runNaturalTextToMQLTimeout.current) {
        clearTimeout(runNaturalTextToMQLTimeout.current);
        runNaturalTextToMQLTimeout.current = null;
      }
    };
  }, []);

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

  useEffect(() => {
    () => {
      isMounted.current = false;
    }
  }, []);

  const onClickTranslateQuery = useCallback(async () => {
    setResultState('loading');

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

      // TODO: One action for multiple state updates, not multiple state updates.
      setErrorMessage(
        ((e as Error)?.message) || `Unable to translate natural language to mql, error: ${e as string}`
      );
      setResultState('error');
      return;
    }

    if (!isMounted) {
      // We have unmounted, no need to continue to setting state.
      // TODO: See if we can cancel the open ai api request in progress
      // if we unmount during a call.
      return;
    }

    const endTime = Date.now();

    // TODO: One action for multiple state updates, not multiple state updates.
    setMQLText(mqlTextString);
    setTranslateTimeMS(endTime - startTime);
    setResultState('awaiting-mql-run');
  }, [ queryText ]);

  // Test queries:

  // Find all of the airports where Altitude is greater than 10000
  // Find all of the documents where Altitude is greater than 10000
  // Expected
  // [{$match : {"Altitude" : {$gt : 10000}}}]

  // Find all of the documents where price is greater than 8

  return (
    <div
      className={resultsContainerStyles}
    >
      {resultState === 'empty' && (
        <Body>
          Enter a query above to see documents here.
        </Body>
      )}
      {resultState === 'loading' && (
        <div className={loadingContainerStyles}>
          <SpinLoader />
        </div>
      )}
      {resultState === 'awaiting-translate-run' && (
        <div>
          <Button
            className={translateButtonStyles}
            variant="primary"
            onClick={() => void onClickTranslateQuery()}
          >Translate</Button>
        </div>
      )}
      {resultState === 'awaiting-mql-run' && (
        <ProposedQuery
          mqlText={mqlText}
          translateTimeMS={translateTimeMS}
          onClickRunQuery={() => void onClickRunQuery()}
        />
      )}
      {resultState === 'loaded' && (
        <>
          <ProposedQuery
            mqlText={mqlText}
            translateTimeMS={translateTimeMS}
            onClickRunQuery={() => void onClickRunQuery()}
          />
          <div>
            <Body>
              Results for <strong>&apos;{queryText}&apos;</strong>
            </Body>
            <div>
              <div className={resultsHeaderStyles}>
                <DocumentResultsHeader
                  resultsView={resultsViewType}
                  onChangeResultsView={setResultsViewType}
                />
              </div>
              <div className={resultsStyles}>
                <DocumentList
                  documents={resultDocuments || [] as Document[]}
                  view={resultsViewType} 
                />
              </div>
            </div>
          </div>
        </>
      )}
      {resultState === 'error' && (
        <div>
          <Banner
            variant="danger"
            dismissible
            onClose={() => setResultState('awaiting-translate-run')}
          >
            {errorMessage}
          </Banner>
        </div>
      )}
    </div>
  );
}

export { QueryResults };
