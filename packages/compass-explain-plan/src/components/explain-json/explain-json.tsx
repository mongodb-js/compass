import type { FunctionComponent } from 'react';
import { useCallback } from 'react';
import React from 'react';
import { Document } from '@mongodb-js/compass-crud';
import { css, KeylineCard, spacing } from '@mongodb-js/compass-components';

const cardStyles = css({ padding: spacing[2] });
interface ExplainJSONProps {
  originalExplainData: Record<string, unknown>;
}

const ExplainJSON: FunctionComponent<ExplainJSONProps> = ({
  originalExplainData,
}) => {
  const copyToClipboard = useCallback(() => {
    void navigator.clipboard.writeText(JSON.stringify(originalExplainData));
  }, [originalExplainData]);

  return (
    <KeylineCard data-testid="explain-json" className={cardStyles}>
      <Document
        copyToClipboard={copyToClipboard}
        doc={originalExplainData}
        editable={false}
        isExpanded={false}
      />
    </KeylineCard>
  );
};

export default ExplainJSON;
