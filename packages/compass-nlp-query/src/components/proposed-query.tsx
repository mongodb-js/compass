import React from 'react';
import { Body, Button, Code, css, spacing } from '@mongodb-js/compass-components';

const containerStyles = css({
  padding: 0
});

const runButtonStyles = css({
  marginTop: spacing[2]
});

type ProposedQueryProps = {
  mqlText: string;
  translateTimeMS: number;
  onClickRunQuery: () => void;
};

function ProposedQuery({
  mqlText,
  translateTimeMS,
  onClickRunQuery
}: ProposedQueryProps): React.ReactElement {
  return (
    <div className={containerStyles}>
      <Body>
        Translated in <strong>{translateTimeMS} ms</strong>.
      </Body>
      <Code
        language="javascript"
      >
        {mqlText}
      </Code>
      <Button
        className={runButtonStyles}
        variant="primary"
        onClick={onClickRunQuery}
      >Run</Button>
    </div>
  );
}

export { ProposedQuery };
