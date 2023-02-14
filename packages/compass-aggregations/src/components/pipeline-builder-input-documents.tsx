import React from 'react';
import { connect } from 'react-redux';
import type { Document as DocumentType } from 'mongodb';

import {
  KeylineCard,
  css,
  cx,
  spacing,
  palette,
  useDarkMode,
  Body,
  IconButton,
  Icon,
} from '@mongodb-js/compass-components';
import { Document } from '@mongodb-js/compass-crud';

import {
  refreshInputDocuments,
  toggleInputDocumentsCollapsed,
} from '../modules/input-documents';
import LoadingOverlay from './loading-overlay';

const headerStyles = css({
  display: 'flex',
  gap: spacing[1],
  alignItems: 'center',
  width: '100%',
  padding: `${spacing[1]}px ${spacing[2]}px`,
});

const headerTextStyles = css({
  flex: 1,
});

const bodyStyles = css({
  position: 'relative',
  padding: `${spacing[2]}px ${spacing[2] + spacing[1]}px`,
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
});

const bodyStylesLight = css({
  borderTopColor: palette.gray.light2,
});

const bodyStylesDark = css({
  borderTopColor: palette.gray.dark2,
});

const documentsContainerStyles = css({
  marginTop: spacing[2],
  paddingBottom: spacing[2],
  display: 'flex',
  overflowX: 'scroll',
  gap: spacing[2],
});

const documentContainerStyles = css({
  flexShrink: 0,
  width: '384px',
  height: '170px',
  overflow: 'scroll',
});

type InputProps = {
  documents: DocumentType[];
  isExpanded: boolean;
  isLoading: boolean;
  count: number;
  toggleInputDocumentsCollapsed: (arg0: boolean) => void;
  refreshInputDocuments: () => void;
};

function PipelineBuilderInputDocuments({
  documents,
  isExpanded,
  isLoading,
  count,
  toggleInputDocumentsCollapsed,
  refreshInputDocuments,
}: InputProps) {
  const darkMode = useDarkMode();

  const toggleExpanded = () => {
    toggleInputDocumentsCollapsed(!isExpanded);
  };

  const expandTooltipText = isExpanded ? 'Collapse' : 'Expand';

  return (
    <KeylineCard>
      <div className={headerStyles}>
        <IconButton
          onClick={toggleExpanded}
          title={expandTooltipText}
          aria-label={expandTooltipText}
        >
          <Icon
            glyph={isExpanded ? 'ChevronDown' : 'ChevronRight'}
            size="small"
          ></Icon>
        </IconButton>
        <Body className={headerTextStyles}>
          <b>
            {count} Document{count === 1 ? '' : 's'}
          </b>{' '}
          in the collection
        </Body>
        <IconButton
          onClick={refreshInputDocuments}
          aria-label="Refresh"
          title="Refresh"
        >
          <Icon glyph="Refresh" size="small" />
        </IconButton>
      </div>
      {isExpanded && (
        <div
          className={cx(
            bodyStyles,
            darkMode ? bodyStylesDark : bodyStylesLight
          )}
        >
          <Body>Preview of documents</Body>
          {isLoading ? <LoadingOverlay text="Sampling Documents..." /> : null}
          <div className={documentsContainerStyles}>
            {documents.map((doc, i) => {
              return (
                <KeylineCard key={i} className={documentContainerStyles}>
                  <Document doc={doc} editable={false} />
                </KeylineCard>
              );
            })}
          </div>
        </div>
      )}
    </KeylineCard>
  );
}

type InputDocuments = {
  documents: DocumentType[];
  isExpanded: boolean;
  isLoading: boolean;
  count: number;
};

export default connect(
  ({ inputDocuments }: { inputDocuments: InputDocuments }) => {
    return {
      documents: inputDocuments.documents,
      isExpanded: inputDocuments.isExpanded,
      isLoading: inputDocuments.isLoading,
      count: inputDocuments.count,
    };
  },
  {
    toggleInputDocumentsCollapsed: toggleInputDocumentsCollapsed,
    refreshInputDocuments: refreshInputDocuments,
  }
)(PipelineBuilderInputDocuments);
