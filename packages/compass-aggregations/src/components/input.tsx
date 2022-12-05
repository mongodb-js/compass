import React, { useState, useMemo } from 'react';
import { connect } from 'react-redux';
import type { Document as DocumentType } from 'mongodb';

import { KeylineCard, css, cx, spacing, palette, useDarkMode, Body, IconButton, Icon } from "@mongodb-js/compass-components";
import { Document } from '@mongodb-js/compass-crud';

import { refreshInputDocuments } from '../modules/input-documents';
import LoadingOverlay from './loading-overlay';

const cardStyles = css({
  margin: `0 ${spacing[3]}px`,
  marginBottom: spacing[3]
});

const headerStyles = css({
  display: 'flex',
  gap: spacing[1],
  alignItems: 'center',
  width: '100%',
  padding: spacing[2],
});


const headerTextStyles = css({
  flex: 1,
});

const bodyStyles = css({
  position: 'relative',
  padding: spacing[3],
  paddingBottom: spacing[2],
  borderTopWidth: '1px',
  borderTopStyle: 'solid'
});

const bodyStylesLight = css({
  borderTopColor: palette.gray.light2
});

const bodyStylesDark = css({
  borderTopColor: palette.gray.dark2
});

const documentsContainerStyles = css({
  marginTop: spacing[3],
  display: 'flex',
  overflowX: 'scroll',
  gap: spacing[3],
  paddingBottom: spacing[2]
});

const documentContainerStyles = css({
  flexShrink: 0,
  width: '384px',
  height: '150px',
  overflow: 'scroll'
});

type InputProps = {
  documents: DocumentType[],
  isLoading: boolean,
  count: number,
  refreshInputDocuments: () => void
};

function Input({ documents, isLoading, count, refreshInputDocuments }: InputProps) {
  const darkMode = useDarkMode();

  const [isExpanded, setExpanded] = useState(true);

  const toggleExpanded = () => {
    setExpanded(!isExpanded);
  };

  const docs = useMemo(() => documents.map((doc, i) => {
    return (
      <KeylineCard key={i} className={documentContainerStyles}>
        <Document doc={doc} editable={false} />
      </KeylineCard>
    );
  }), [documents]);

  return (<KeylineCard className={cardStyles}>
    <div className={headerStyles}>
      <IconButton onClick={toggleExpanded} aria-label={isExpanded ? 'Collapse' : 'Expand'}>
        <Icon glyph={isExpanded ? 'ChevronDown' : 'ChevronRight'} size="small"></Icon>
      </IconButton>
      <Body className={headerTextStyles}><b>{count} Document{count === 1 ? '' : 's'}</b> in the collection</Body>
      <IconButton onClick={refreshInputDocuments} aria-label="Refresh">
        <Icon glyph="Refresh" size="small" />
      </IconButton>
    </div>
    {isExpanded && <div className={cx(bodyStyles, darkMode ? bodyStylesDark : bodyStylesLight)}>
      <Body>Preview of documents</Body>
      { isLoading ?
        <LoadingOverlay text="Sampling Documents..." /> :
        null
      }
      <div className={documentsContainerStyles}>
        {docs}
      </div>
    </div>}
  </KeylineCard>);
}

type InputDocuments = {
  documents: DocumentType[],
  isLoading: boolean,
  count: number
};

export default connect(
  ({ inputDocuments }: { inputDocuments: InputDocuments}) => {
    return {
      documents: inputDocuments.documents,
      isLoading: inputDocuments.isLoading,
      count: inputDocuments.count
    };
  },
  {
    refreshInputDocuments: refreshInputDocuments
  }
)(Input);
