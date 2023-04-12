import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import {
  Banner,
  Body,
  Code,
  css,
  spacing,
} from '@mongodb-js/compass-components';

import type {
  ExportStatus,
  FieldsToExportOption,
  FieldsToExport,
} from '../modules/export';
import type { RootExportState } from '../stores/export-store';
import { createProjectionFromSchemaFields } from '../export/gather-fields';
import type { ExportAggregation, ExportQuery } from '../export/export-types';
import { newGetQueryAsShellJSString } from '../utils/get-shell-js';

const codeStyles = css({
  marginBottom: spacing[2],
});

type ExportCodeViewProps = {
  ns: string;
  query?: ExportQuery;
  aggregation?: ExportAggregation;
  fields: FieldsToExport;
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
          ...(query ?? {
            filter: {},
          }),
          projection: createProjectionFromSchemaFields(
            Object.values(fields)
              .filter((field) => field.selected)
              .map((field) => field.fieldPath)
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
  }, [aggregation, fields, query, ns, selectedFieldOption]);

  return (
    <>
      <Body>
        Export results from the {aggregation ? 'aggregation' : 'query'} below
      </Body>
      {!!aggregation &&
        !exportFullCollection &&
        !!selectedFieldOption &&
        query?.projection &&
        Object.keys(query.projection).length > 0 && (
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
