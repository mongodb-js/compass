import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import HadronDocument from 'hadron-document';
import type { DataService } from 'mongodb-data-service';
import type { Document } from 'mongodb';
import { ObjectId } from 'mongodb';
// import { Element } from 'hadron-document';
import {
  // Banner,
  FormModal,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { useTrackOnChange } from '@mongodb-js/compass-logging';
import type { TypeCastMap } from 'hadron-type-checker';
import { toJSString } from 'mongodb-query-parser';
// import parseString, { toJSString, isFilterValid } from 'mongodb-query-parser';
import { EJSON } from 'bson';
import _parseShellBSON, { ParseMode } from 'ejson-shell-parser';
import { prettify } from '@mongodb-js/compass-editor';
import babelGenerate from '@babel/generator';
import type { Node } from '@babel/types';
import type { FormatOptions } from '@mongodb-js/compass-editor';

import type { InsertCSFLEWarningBannerProps } from './insert-csfle-warning-banner';
import { useInsertDocumentViewTypeControls } from './use-insert-document-view-type';
import { InsertDocumentEditor } from './insert-document-editor';

const insertEditorContainerStyles = css({
  paddingTop: spacing[2],
  paddingBottom: spacing[2],
  minHeight: spacing[5] * 8,
});

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
export function parseShellBSON(source: string): Document | Document[] {
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
  initialDocumentForInsert?: HadronDocument | null;
  isOpen: boolean;
  ns: string;

  closeInsertDocumentModal: () => void;
  // onInsertClick: (docs: BSONObject[]) => void;
  insertMany: DataService['insertMany'];
  onDocumentsInserted: (insertedInfo: {
    ns: string;
    docs: BSONObject[];
  }) => void;
  // onInsertManyClick: (docs: BSONObject[]) => void;
};

// We insert a first element into the hadron document when it's made
// so that it has at least one value the user can edit.
function createHadronDocumentWithPlaceholder(
  existingHadronDocument?: HadronDocument
) {
  if (existingHadronDocument?.elements.size > 0) {
    return existingHadronDocument;
  }
  const document = new HadronDocument();
  // document.insertBeginning('field', 'value');
  // document.insertPlaceholder();
  document.insertBeginning('_id', new ObjectId());

  return document;
}

export const InsertDocumentModal: React.FunctionComponent<
  InsertDocumentModalProps
> = ({
  initialDocumentForInsert,
  isOpen,
  ns,
  insertMany,
  closeInsertDocumentModal,
  onDocumentsInserted,
}) => {
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
  console.log(
    'aaaa initialDinitialDocumentForInsertocumentForInsert',
    initialDocumentForInsert
  );

  const [isInsertInProgress, setIsInsertInProgress] = useState(false);

  /**
   * We maintain 3 different document arrays.
   * One for each view type / editor.
   * Only the current editor's documents are up to date.
   */
  const [ejsonDocumentsString, setEJSONDocuments] = useState(() => {
    return `${initialDocumentForInsert?.toEJSON() ?? '{}'}`;
  });
  const [hadronDocuments, setHadronDocuments] = useState(() => {
    return [createHadronDocumentWithPlaceholder(initialDocumentForInsert)];
  });
  const [shellDocumentsString, setShellDocuments] = useState(() => {
    const bsonDoc = initialDocumentForInsert
      ? EJSON.parse(initialDocumentForInsert.toEJSON())
      : {};
    console.log('aaaa bson doc', bsonDoc);
    console.log('aaaa ejson doc', initialDocumentForInsert?.toEJSON());
    console.log(
      'aaaa josn string doc',
      toJSString(initialDocumentForInsert?.toEJSON() || {})
    );
    return `${toJSString(bsonDoc) || '{}'}`;
  });

  // When it's opened and the initial document updates we set the initial values.
  useLayoutEffect(() => {
    if (isOpen) {
      const hadronDoc = createHadronDocumentWithPlaceholder(
        initialDocumentForInsert
      );
      const ejsonDoc = hadronDoc.toEJSON();
      setEJSONDocuments(`${ejsonDoc}`);
      const bsonDoc = EJSON.parse(ejsonDoc);
      setShellDocuments(toJSString(bsonDoc) || '{}');
      setHadronDocuments([hadronDoc]);
    }
  }, [isOpen, initialDocumentForInsert]);

  // {
  //   _id: ObjectId('62792820e149102abe21dfc3')
  // }

  const [viewTypeControls, viewType] = useInsertDocumentViewTypeControls({
    // TOOD: Somethings
    // eslint-disable-next-line no-console
    onChange: (currentViewType, newViewType) => {
      // console.log(currentViewType);
      // TODO: Update our documents accordingly.
      let currentDocs: BSONObject[] | BSONObject = [];
      // let isArray = false;

      // Get the current value of the documents
      if (currentViewType === 'EJSON') {
        try {
          const parsedEJSON = JSON.parse(ejsonDocumentsString);
          if (Array.isArray(parsedEJSON)) {
            // isArray = true;
            // TODO: Maybe need a check on size
            currentDocs = HadronDocument.FromEJSONArray(
              ejsonDocumentsString
            ).map((doc: HadronDocument) => doc.generateObject());
          } else {
            currentDocs =
              HadronDocument.FromEJSON(ejsonDocumentsString).generateObject();
          }
        } catch {
          // TODO: Set error here
          // TODO: Reset the view type change with callback ?
          return;
        }
      } else if (currentViewType === 'Shell') {
        try {
          // TODO: Make this more secure, not eval on straight documents
          // from cloning... Maybe something like the pipeline-parser.

          currentDocs = parseShellBSON(shellDocumentsString);
          // if (Array.isArray(parsedBSON)) {
          //   isArray = true;
          //   // TODO: Maybe need a check on size
          //   currentDocs = parsedBSON;
          // } else {
          //   currentDocs = [parsedBSON];
          // }
          // TODO: Parse into docs.
          // isArray = true;

          // return true;
        } catch (err) {
          // TODO: More error management.
          return false;
        }
      } else {
        // Don't create an array if we only are editing one document and the user is swapping about.
        if (hadronDocuments.length === 1) {
          currentDocs = hadronDocuments[0].generateObject();
        } else {
          currentDocs = hadronDocuments.map((hadronDoc) =>
            hadronDoc.generateObject()
          );
        }
      }

      if (newViewType === 'EJSON') {
        setEJSONDocuments(EJSON.stringify(currentDocs, undefined, 2));
      } else if (newViewType === 'Shell') {
        setShellDocuments(toJSString(currentDocs, 2) || '{}');
      } else {
        // TODO: Hadron doc.
        //
        if (Array.isArray(currentDocs)) {
          setHadronDocuments(
            currentDocs.map((doc) =>
              createHadronDocumentWithPlaceholder(new HadronDocument(doc))
            )
          );
        } else {
          setHadronDocuments([
            createHadronDocumentWithPlaceholder(
              new HadronDocument(currentDocs)
            ),
          ]);
        }
      }
    },
  });

  const hasDocErrors = useMemo(() => {
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
        return false;
      } catch (err) {
        return true;
      }
    }

    // TODO: Create hadron document hook that manages errors.
    // return this.invalidElements.length > 0;
    return true;
  }, [viewType, ejsonDocumentsString, shellDocumentsString]);

  const onInsertMany = useCallback(
    async (docs: BSONObject[]) => {
      setIsInsertInProgress(true);

      try {
        await insertMany(ns, docs);
        onDocumentsInserted({
          ns,
          docs,
        });
      } catch (e) {
        // TODO: Set error.
      }

      setIsInsertInProgress(false);
    },
    [ns, insertMany, onDocumentsInserted]
  );

  const onSubmitClick = useCallback(() => {
    let docs = [];

    if (viewType === 'EJSON') {
      try {
        const parsedEJSON = JSON.parse(ejsonDocumentsString);
        if (Array.isArray(parsedEJSON)) {
          // TODO: Maybe need a check on size
          docs = HadronDocument.FromEJSONArray(ejsonDocumentsString).map(
            (doc: HadronDocument) => doc.generateObject()
          );
        } else {
          docs = [
            HadronDocument.FromEJSON(ejsonDocumentsString).generateObject(),
          ];
        }
      } catch {
        // TODO: Set error here
        return;
      }
    } else if (viewType === 'Shell') {
      try {
        // TODO: Make this more secure, not eval on straight documents
        // from cloning... Maybe something like the pipeline-parser.

        // TODO: Parse into docs.
        parseShellBSON(shellDocumentsString);
        return true;
      } catch (err) {
        return false;
      }
    } else {
      // TODO: Hadron doc.
      docs = hadronDocuments.map((hadronDoc) => hadronDoc.toEJSON());
    }

    // onInsertClick(docs);
    void onInsertMany(docs);
    // TODO: Could make this not depended on these strings if we want, have that set elsewhere.
  }, [
    viewType,
    // onInsertClick,
    onInsertMany,
    ejsonDocumentsString,
    shellDocumentsString,
    hadronDocuments,
  ]);

  return (
    <FormModal
      title="Insert Document"
      subtitle={`To collection ${ns}`}
      open={isOpen}
      onSubmit={onSubmitClick}
      onCancel={closeInsertDocumentModal}
      submitButtonText="Insert"
      // TODO: Show loader on insert in progress.
      submitDisabled={hasDocErrors || isInsertInProgress}
      data-testid="insert-document-modal"
      minBodyHeight={spacing[6] * 2} // make sure there is enough space for the menu
    >
      {viewTypeControls}
      <div className={insertEditorContainerStyles}>
        <InsertDocumentEditor
          onChangeEJSONDocuments={setEJSONDocuments}
          onChangeShellDocuments={setShellDocuments}
          onChangeHadronDocuments={setHadronDocuments}
          ejsonDocumentsString={ejsonDocumentsString}
          shellDocumentsString={shellDocumentsString}
          hadronDocuments={hadronDocuments}
          view={viewType}
        />
      </div>
      {/* {message && (
          <Banner
            data-testid="insert-document-banner"
            data-variant={variant}
            variant={variant}
            className={bannerStyles}
          >
            {message}
          </Banner>
        )} */}
    </FormModal>
  );
};
