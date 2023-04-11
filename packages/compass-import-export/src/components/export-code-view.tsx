import React, { useMemo } from 'react';
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
import { createProjectionFromSchemaFields } from '../export/gather-fields';
import type { SchemaPath } from '../export/gather-fields';
import type { ExportAggregation, ExportQuery } from '../export/export-types';
import { newGetQueryAsShellJSString } from '../utils/get-shell-js';

const codeStyles = css({
  marginBottom: spacing[2],
});

type ExportCodeViewProps = {
  ns: string;
  query: ExportQuery;
  aggregation: ExportAggregation;
  fields: SchemaPath[];
  selectedFieldOption: undefined | FieldsToExportOption;
  exportFullCollection?: boolean;
  status: ExportStatus;
};

function ExportCodeView({
  ns,
  query,
  fields,
  aggregation,
  exportFullCollection,
  selectedFieldOption,
}: ExportCodeViewProps) {
  const code = useMemo(() => {
    if (aggregation) {
      return JSON.stringify(aggregation);
    }

    if (selectedFieldOption === 'select-fields') {
      return newGetQueryAsShellJSString({
        query: {
          ...query,
          project: createProjectionFromSchemaFields(fields),
        },
        ns,
      });
    }

    return newGetQueryAsShellJSString({
      query,
      ns,
    });
  }, [aggregation, fields, query, ns, selectedFieldOption]);

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
        {code}
      </Code>
    </>
  );
}

const ConnectedExportCodeView = connect(
  (state: RootExportState) => ({
    ns: state.export.namespace,
    fields: state.export.fieldsToExport,
    query: state.export.query,
    aggregation: state.export.aggregation,
    exportFullCollection: state.export.exportFullCollection,
    status: state.export.status,
    selectedFieldOption: state.export.selectedFieldOption,
  }),
  null
)(ExportCodeView);

export { ConnectedExportCodeView as ExportCodeView };
