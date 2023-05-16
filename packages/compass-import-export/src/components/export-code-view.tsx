import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import { Body, Code, css, spacing } from '@mongodb-js/compass-components';

import type { FieldsToExportOption, FieldsToExport } from '../modules/export';
import type { RootExportState } from '../stores/export-store';
import { createProjectionFromSchemaFields } from '../export/gather-fields';
import type { ExportAggregation, ExportQuery } from '../export/export-types';
import {
  aggregationAsShellJSString,
  queryAsShellJSString,
} from '../utils/get-shell-js-string';

const containerStyles = css({
  marginBottom: spacing[3],
});

const codeStyles = css({
  maxHeight: '30vh',
});

type ExportCodeViewProps = {
  ns: string;
  query?: ExportQuery;
  aggregation?: ExportAggregation;
  fields: FieldsToExport;
  selectedFieldOption: FieldsToExportOption;
};

function ExportCodeView({
  ns,
  query,
  aggregation,
  fields,
  selectedFieldOption,
}: ExportCodeViewProps) {
  const code = useMemo(() => {
    if (aggregation) {
      return aggregationAsShellJSString({
        aggregation,
        ns,
      });
    }

    if (selectedFieldOption === 'select-fields') {
      return queryAsShellJSString({
        query: {
          ...(query ?? {
            filter: {},
          }),
          projection: createProjectionFromSchemaFields(
            Object.values(fields)
              .filter((field) => field.selected)
              .map((field) => field.path)
          ),
        },
        ns,
      });
    }

    return queryAsShellJSString({
      query: query ?? {
        filter: {},
      },
      ns,
    });
  }, [aggregation, fields, query, ns, selectedFieldOption]);

  return (
    <div className={containerStyles}>
      <Body>
        Export results from the {aggregation ? 'aggregation' : 'query'} below
      </Body>
      <Code
        className={codeStyles}
        data-testid="export-collection-code-preview-wrapper"
        language="javascript"
        copyable
      >
        {code}
      </Code>
    </div>
  );
}

const ConnectedExportCodeView = connect(
  (state: RootExportState) => ({
    ns: state.export.namespace,
    aggregation: state.export.aggregation,
    fields: state.export.fieldsToExport,
    query: state.export.query,
    selectedFieldOption: state.export.selectedFieldOption,
  }),
  null
)(ExportCodeView);

export { ExportCodeView as UnconnectedExportCodeView };
export { ConnectedExportCodeView as ExportCodeView };
