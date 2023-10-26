import React, { useCallback, useEffect } from 'react';
// import type HadronDocument from 'hadron-document';
import { Document as HadronDocument, Element } from 'hadron-document';
import {
  Button,
  DocumentList,
  Icon,
  css,
  spacing,
} from '@mongodb-js/compass-components';

import type { ViewType } from './use-insert-document-view-type';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';

export type InsertDocumentEditorProps = {
  view: ViewType;
  onChangeEJSONDocuments: (docs: string) => void;
  onChangeShellDocuments: (docs: string) => void;
  onChangeHadronDocuments: (docs: HadronDocument[]) => void; // TODO
  ejsonDocumentsString: string;
  shellDocumentsString: string;
  hadronDocuments: HadronDocument[];
};

function ShellEditor({
  text,
  onChangeText,
}: {
  text: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <CodemirrorMultilineEditor
      text={text}
      onChangeText={onChangeText}
      // annotations={annotations} // TODO
      id="insert-doc-shell-editor"
      data-testid="insert-doc-shell-editor"
      // completer={completer} // TODO
      minLines={16}
      // className={codeEditorStyles} // TODO
    />
  );
}

function EJSONEditor({
  text,
  onChangeText,
}: {
  text: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <CodemirrorMultilineEditor
      language="json"
      initialJSONFoldAll={false}
      text={text}
      onChangeText={onChangeText}
      // annotations={annotations} // TODO
      id="insert-doc-ejson-editor"
      data-testid="insert-doc-ejson-editor"
      // completer={completer} // TODO
      minLines={16}
      // className={codeEditorStyles} // TODO
    />
  );
}

const hadronDocumentItemContainerStyles = css({
  marginBottom: spacing[2],
  marginTop: spacing[2],
});

// const hadronDocumentActionsContainerStyles = css({
//   display: 'flex',
//   justifyContent: 'center',
// });

// TODO: If they switched here with > 100 docs let's error or only show the first 100.
function HadronDocEditor({
  hadronDocuments,
  onChangeHadronDocuments,
}: {
  hadronDocuments: HadronDocument[];
  onChangeHadronDocuments: (hadronDocuments: HadronDocument[]) => void;
}) {
  useEffect(() => {
    // TODO: Listen to changes.
  }, []);

  // TODO: Add document button.

  // const onAddNewDocClick = useCallback(() => {
  //   onChangeHadronDocuments([...hadronDocuments, new HadronDocument()])
  // }, [hadronDocuments, onChangeHadronDocuments]);

  return (
    <div>
      {hadronDocuments.map((doc, index) => (
        // <InsertHadronDocument doc={this.props.doc} />
        <div className={hadronDocumentItemContainerStyles} key={index}>
          <DocumentList.Document value={doc} editable editing />
        </div>
      ))}
      {/* <div className={hadronDocumentActionsContainerStyles}>
        <Button
          onClick={onAddNewDocClick}
          variant="primaryOutline"
          leftGlyph={<Icon glyph="Plus" />}
          size="small"
        >
          Add Document
        </Button>
      </div> */}
    </div>
  );
}

export const InsertDocumentEditor: React.FunctionComponent<
  InsertDocumentEditorProps
> = ({
  view,
  onChangeEJSONDocuments,
  onChangeShellDocuments,
  onChangeHadronDocuments,
  ejsonDocumentsString,
  shellDocumentsString,
  hadronDocuments,
}) => {
  // useLayoutEffect(() => {

  // }, []);

  // useEffect

  if (view === 'Shell') {
    return (
      <ShellEditor
        onChangeText={onChangeShellDocuments}
        text={shellDocumentsString}
      />
    );
  }

  if (view === 'EJSON') {
    return (
      <EJSONEditor
        onChangeText={onChangeEJSONDocuments}
        text={ejsonDocumentsString}
      />
    );
  }

  return (
    <HadronDocEditor
      // TODO
      onChangeHadronDocuments={onChangeHadronDocuments}
      hadronDocuments={hadronDocuments}
    />
  );
};
