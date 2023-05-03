import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import { Body, Code, css, spacing } from '@mongodb-js/compass-components';

import type { FieldsToExportOption, FieldsToExport } from '../modules/export';
import type { RootExportState } from '../stores/export-store';
import { createProjectionFromSchemaFields } from '../export/gather-fields';
import type { ExportQuery } from '../export/export-types';
import { newGetQueryAsShellJSString } from '../utils/get-shell-js';

const containerStyles = css({
  marginBottom: spacing[3],
});

type ExportCodeViewProps = {
  ns: string;
  query?: ExportQuery;
  fields: FieldsToExport;
  selectedFieldOption: FieldsToExportOption;
};

function ExportCodeView({
  ns,
  query,
  fields,
  selectedFieldOption,
}: ExportCodeViewProps) {
  const code = useMemo(() => {
    if (selectedFieldOption === 'select-fields') {
      return newGetQueryAsShellJSString({
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

    return newGetQueryAsShellJSString({
      query: query ?? {
        filter: {},
      },
      ns,
    });
  }, [fields, query, ns, selectedFieldOption]);

  return (
    <div className={containerStyles}>
      <Body>Export results from the query below</Body>
      <Code
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
    fields: state.export.fieldsToExport,
    query: state.export.query,
    selectedFieldOption: state.export.selectedFieldOption,
  }),
  null
)(ExportCodeView);

export { ExportCodeView as UnconnectedExportCodeView };
export { ConnectedExportCodeView as ExportCodeView };
