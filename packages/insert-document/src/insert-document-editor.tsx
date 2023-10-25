import React from 'react';
// import type Document from 'hadron-document';
import type HadronDocument from 'hadron-document';
import { Element } from 'hadron-document';
import {
  Banner,
  css,
  Icon,
  SegmentedControl,
  SegmentedControlOption,
  spacing,
} from '@mongodb-js/compass-components';

import type { ViewType } from './use-insert-document-view-type';

export type InsertDocumentEditorModalProps = {
  onChangeDocument: () => void;
  view: ViewType;
  initialDoc: HadronDocument;
};

export const InsertDocumentEditor: React.FunctionComponent<
  InsertDocumentEditorProps
> = ({ view, initialDoc }) => {
  // useLayoutEffect(() => {

  // }, []);

  // useEffect

  return <div>Insert doc</div>;
};
