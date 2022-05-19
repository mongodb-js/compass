import type HadronDocument from "hadron-document";

type Doc = HadronDocument | Record<string, any>;

export const Document: React.ComponentClass<{
  doc: Doc;
  editable?: boolean;
  isTimeSeries?: boolean;
  removeDocument?: () => void;
  replaceDocument?: () => void;
  updateDocument?: () => void;
  openInsertDocumentDialog?: () => void;
  copyToClipboard?: () => void;
}>;

type ListViewProps = {
  docs: Doc[];
  isEditable?: boolean;
  isTimeSeries?: boolean;
  removeDocument?: (doc: HadronDocument) => void;
  replaceDocument?: (doc: HadronDocument) => void;
  updateDocument?: (doc: HadronDocument) => void;
  openInsertDocumentDialog?: (doc: HadronDocument, clone: boolean) => void;
  copyToClipboard?: (doc: HadronDocument) => void;
};

export const DocumentListView: React.ComponentClass<ListViewProps>;
export const DocumentJsonView: React.ComponentClass<ListViewProps>;
