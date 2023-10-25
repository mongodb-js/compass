import React, { useCallback, useMemo, useState } from 'react';
import type HadronDocument from 'hadron-document';
import { Element } from 'hadron-document';
import {
  Banner,
  css,
  FormModal,
  Icon,
  SegmentedControl,
  SegmentedControlOption,
  spacing,
} from '@mongodb-js/compass-components';
import { useTrackOnChange } from '@mongodb-js/compass-logging';
import type { TypeCastMap } from 'hadron-type-checker';
import parseString, { toJSString, isFilterValid } from 'mongodb-query-parser';
import { EJSON } from 'bson';
import _parseShellBSON, { ParseMode } from 'ejson-shell-parser';
import { prettify } from '@mongodb-js/compass-editor';
import babelGenerate from '@babel/generator';
import type { Node } from '@babel/types';
import type { FormatOptions } from '@mongodb-js/compass-editor';

import type { InsertCSFLEWarningBannerProps } from './insert-csfle-warning-banner';
import { useInsertDocumentViewTypeControls } from './use-insert-document-view-type';
import { InsertDocumentEditor } from './insert-document-editor';

export function generate(ast: Node, formatOptions?: FormatOptions) {
  return prettify(
    babelGenerate(ast).code,
    'javascript-expression',
    formatOptions
  );
}

/**
 * @param source expression source (object or array expression with optional
 *               leading / trailing comments)
 */
export function parseShellBSON(source: string): Document[] {
  const parsed = _parseShellBSON(source, { mode: ParseMode.Loose });
  if (!parsed || typeof parsed !== 'object') {
    // XXX(COMPASS-5689): We've hit the condition in
    // https://github.com/mongodb-js/ejson-shell-parser/blob/c9c0145ababae52536ccd2244ac2ad01a4bbdef3/src/index.ts#L36
    throw new Error('Source expression is invalid');
  }
  return parsed;
}

type BSONObject = TypeCastMap['Object'];

export type InsertDocumentModalProps = InsertCSFLEWarningBannerProps & {
  // TODO: What's the `message`?
  initialDocumentForInsert: HadronDocument;
  isOpen: boolean;
  ns: string;

  closeInsertDocumentModal: () => void;
  onInsertClick: (docs: BSONObject[]) => void;
  // onInsertManyClick: (docs: BSONObject[]) => void;
};

export const InsertDocumentModal: React.FunctionComponent<
  InsertDocumentModalProps
> = ({ initialDocumentForInsert, isOpen, ns, closeInsertDocumentModal }) => {
  useTrackOnChange(
    // TODO: Should be in compass-crud if event called this..
    'COMPASS-CRUD-UI',
    (track) => {
      if (isOpen) {
        track('Screen', { name: 'insert_document_modal' });
      }
    },
    [isOpen],
    undefined,
    React
  );

  // const onViewTypeChange = useCallback(
  //   (newType) => {
  //     track('Switch Insert Document View Type', { view_type: newType, item_type: itemType });
  //   },
  //   [itemType]
  // );

  const [viewTypeControls, viewType] = useInsertDocumentViewTypeControls({
    // TOOD: Somethings
    // eslint-disable-next-line no-console
    onChange: (newViewType) => {
      console.log(newViewType);
    },
  });

  /**
   * We maintain 3 different document arrays.
   * One for each view type / editor.
   * Only the current editor's documents are up to date.
   */
  const [ejsonDocumentsString, setEJSONDocuments] = useState(() => {
    return `${[initialDocumentForInsert.toEJSON()]}`;
  });
  const [hadronDocuments, setHadronDocuments] = useState(() => {
    return [initialDocumentForInsert];
  });
  const [shellDocumentsString, setShellDocuments] = useState(() => {
    // TODO: To shell syntax string from ejson.

    const bsonDoc = EJSON.parse(initialDocumentForInsert.toEJSON());
    const shellDocString = toJSString(bsonDoc);

    return `${[shellDocString]}`;
  });

  const hasErrors = useMemo(() => {
    if (viewType === 'EJSON') {
      try {
        JSON.parse(ejsonDocumentsString);
        return false;
      } catch {
        return true;
      }
    } else if (viewType === 'Shell') {
      try {
        // TODO: Make this more secure, not eval on straight documents
        // from cloning... Maybe something like the pipeline-parser.
        parseShellBSON(shellDocumentsString);
        return true;
      } catch (err) {
        return false;
      }
    }

    return true;
    // TODO: Create hadron document hook that manages this.
    // return this.invalidElements.length > 0;
  }, [viewType, ejsonDocumentsString, hadronDocuments, shellDocumentsString]);

  const onSubmitClick = useCallback(() => {}, [viewType, documents]);

  return (
    <FormModal
      title="Insert Document"
      subtitle={`To collection ${ns}`}
      open={isOpen}
      onSubmit={onSubmitClick}
      onCancel={closeInsertDocumentModal}
      submitButtonText="Insert"
      submitDisabled={hasErrors}
      data-testid="insert-document-modal"
      minBodyHeight={spacing[6] * 2} // make sure there is enough space for the menu
    >
      {viewTypeControls}
      <InsertDocumentEditor initialDoc={} view={viewType} />
    </FormModal>
  );
};
