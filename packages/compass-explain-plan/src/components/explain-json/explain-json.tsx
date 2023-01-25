import type { FunctionComponent } from 'react';
import { useCallback, useMemo } from 'react';
import React from 'react';
import HadronDocument from 'hadron-document';
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

  const doc = useMemo(
    () => new HadronDocument(originalExplainData),
    [originalExplainData]
  );

  return (
    <KeylineCard data-testid="explain-json" className={cardStyles}>
      <Document
        copyToClipboard={copyToClipboard}
        doc={doc}
        editable={false}
        isExpanded={false}
      />
    </KeylineCard>
  );
};

ExplainJSON.displayName = 'ExplainJSONComponent';

export default ExplainJSON;
