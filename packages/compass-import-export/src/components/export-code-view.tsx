import React from 'react';
import { connect } from 'react-redux';
import {
  Banner,
  Body,
  Code,
  css,
  spacing,
} from '@mongodb-js/compass-components';

import type { ExportStatus, FieldsToExportOption } from '../modules/new-export';
import type { RootExportState } from '../stores/new-export-store';

const codeStyles = css({
  marginBottom: spacing[2],
});

type ExportCodeViewProps = {
  ns: string;
  query: any; // todo types from Le Roux's pr
  aggregation: any; // todo types from Le Roux's pr
  selectedFieldOption: undefined | FieldsToExportOption;
  exportFullCollection?: boolean;
  status: ExportStatus;
};

function ExportCodeView({
  ns,
  query,
  aggregation,
  exportFullCollection,
  selectedFieldOption,
}: ExportCodeViewProps) {
  return (
    <>
      <Body>
        Export results from the {aggregation ? 'aggregation' : 'query'} below
      </Body>
      {!!aggregation &&
        !exportFullCollection &&
        !!selectedFieldOption &&
        query.project &&
        Object.keys(query.project).length > 0 && (
          <Banner>
            Only projected fields will be exported. To export all fields, go
            back and leave the PROJECT field empty.
          </Banner>
        )}
      <Code className={codeStyles} language="javascript" copyable>
        {aggregation ? JSON.stringify(aggregation) : JSON.stringify(query)}
      </Code>
    </>
  );
}

const ConnectedExportCodeView = connect(
  (state: RootExportState) => ({
    ns: state.export.namespace,
    query: state.export.query,
    aggregation: state.export.aggregation,
    exportFullCollection: state.export.exportFullCollection,
    status: state.export.status,
    selectedFieldOption: state.export.selectedFieldOption,
  }),
  null
)(ExportCodeView);

export { ConnectedExportCodeView as ExportCodeView };
