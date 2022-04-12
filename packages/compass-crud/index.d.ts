import type HadronDocument from "hadron-document";

export const Document: React.ComponentClass<{
  doc: HadronDocument;
  editable?: boolean;
  isTimeSeries?: boolean;
  removeDocument?: () => void;
  replaceDocument?: () => void;
  updateDocument?: () => void;
  openInsertDocumentDialog?: () => void;
  copyToClipboard?: () => void;
}>;

type ListViewProps = {
  docs: HadronDocument[];
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
