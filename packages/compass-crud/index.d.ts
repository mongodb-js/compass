import type HadronDocument from 'hadron-document';

type Doc = HadronDocument | Record<string, any>;

export const Document: React.ComponentClass<{
  doc: Doc;
  editable?: boolean;
  isTimeSeries?: boolean;
  isExpanded?: boolean;
  removeDocument?: () => void;
  replaceDocument?: () => void;
  updateDocument?: () => void;
  openInsertDocumentDialog?: () => void;
  copyToClipboard?: () => void;
}>;

type ListViewProps = {
  className?: string;
  isEditable?: boolean;
  isTimeSeries?: boolean;
  isExpanded?: boolean;
  removeDocument?: (doc: HadronDocument) => void;
  replaceDocument?: (doc: HadronDocument) => void;
  updateDocument?: (doc: HadronDocument) => void;
  openInsertDocumentDialog?: (doc: HadronDocument, clone: boolean) => void;
  copyToClipboard?: (doc: HadronDocument) => void;
};

export const DocumentListView: React.ComponentClass<
  ListViewProps & {
    docs: Doc[];
  }
>;
export const DocumentJsonView: React.ComponentClass<
  ListViewProps & {
    docs: HadronDocument[];
  }
>;
