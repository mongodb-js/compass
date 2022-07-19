import React from 'react';
import { Banner, Body, Button, SpinLoader, css, spacing } from '@mongodb-js/compass-components';

import { ProposedQuery } from './proposed-query';
import type { TranslateState } from '../hooks/use-nlp-query';

const loadingContainerStyles = css({
  padding: spacing[4],
});

const translateButtonStyles = css({
  marginTop: spacing[1],
});

type TranslateViewProps = {

  mqlText: string;

  onClearError: () => void;
  onClickOpenAggregation: () => void;
  onTranslateQuery: () => Promise<void>;
  onRunQuery: () => Promise<void>;

  translateState: TranslateState;
  translateTimeMS: number;
  translateErrorMessage?: string;
};

function TranslateView({
  mqlText,
  onClearError,
  onClickOpenAggregation,
  onRunQuery,
  onTranslateQuery,
  translateErrorMessage,
  translateTimeMS,
  translateState,
}: TranslateViewProps): React.ReactElement {
  switch (translateState) {
    case 'empty': 
      return (
        <Body>
          Enter a query above to see documents here.
        </Body>
      );
    case 'awaiting-run': {
      return (
        <div>
          <Button
            className={translateButtonStyles}
            variant="primary"
            onClick={() => void onTranslateQuery()}
          >Translate</Button>
        </div>
      );
    }
    case 'loading': {
      return (
        <div className={loadingContainerStyles}>
          <SpinLoader />
        </div>
      );
    }
    case 'loaded': {
      return (
        <ProposedQuery
          mqlText={mqlText}
          translateTimeMS={translateTimeMS}
          onClickRunQuery={() => void onRunQuery()}
          onClickOpenAggregation={onClickOpenAggregation}
        />
      );
    }
    case 'error': {
      return (
        <div>
          <Banner
            variant="danger"
            dismissible
            onClose={onClearError}
          >
            {translateErrorMessage}
          </Banner>
        </div>
      );
    }
  }
}

export { TranslateView };
