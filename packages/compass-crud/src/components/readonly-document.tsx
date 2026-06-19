import React from 'react';
import { DocumentList, css, cx, spacing } from '@mongodb-js/compass-components';
import type Document from 'hadron-document';
import type { TypeCastMap } from 'hadron-type-checker';
import { withPreferences } from 'compass-preferences-model/provider';
import { getInsightsForDocument } from '../utils';
import { DocumentEvents } from 'hadron-document';
import { StickyPreviewGutter } from './readonly-document-sticky-preview-gutter';
type BSONObject = TypeCastMap['Object'];

export const documentStyles = css({
  position: 'relative',
  textOverflow: 'ellipsis',
  maxWidth: '100%',
  borderRadius: 'inherit',

  '&::-webkit-scrollbar': {
    display: 'none',
  },
});

export const documentContentStyles = css({
  paddingTop: spacing[400],
  paddingBottom: spacing[400],
});

const stickyPreviewRowStyles = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'stretch',
  height: '100%',
  minHeight: 0,
});

const stickyPreviewDocumentScrollStyles = css({
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  overflow: 'auto',
});

export type ReadonlyDocumentProps = {
  copyToClipboard?: (doc: Document) => void;
  openInsertDocumentDialog?: (doc: BSONObject, cloned: boolean) => void;
  doc: Document;
  showInsights?: boolean;
  onUpdateQuery?: (field: string, value: unknown) => void;
  query?: Record<string, unknown>;
  /**
   * When true, expand/actions stay in a fixed left gutter while the document scrolls
   * beside it (e.g. Aggregations stage preview cards).
   */
  stickyDocumentHeaderInScrollContainer?: boolean;
};

type ReadonlyDocumentState = {
  expanded: boolean;
};

/**
 * Component for a single readonly document in a list of documents.
 */
class ReadonlyDocument extends React.Component<
  ReadonlyDocumentProps,
  ReadonlyDocumentState
> {
  constructor(props: ReadonlyDocumentProps) {
    super(props);
    this.state = {
      expanded: props.doc.expanded,
    };
  }

  /**
   * Subscribe to the update store on mount.
   */
  componentDidMount() {
    this.subscribeToDocumentEvents(this.props.doc);
  }

  /**
   * Refreshing the list updates the doc in the props so we should update the
   * document on the instance.
   */
  componentDidUpdate(prevProps: ReadonlyDocumentProps) {
    if (prevProps.doc !== this.props.doc) {
      this.unsubscribeFromDocumentEvents(prevProps.doc);
      this.subscribeToDocumentEvents(this.props.doc);
    }
  }

  /**
   * Unsubscribe from the update store on unmount.
   */
  componentWillUnmount() {
    this.unsubscribeFromDocumentEvents(this.props.doc);
  }

  /**
   * Subscribe to the document events.
   */
  subscribeToDocumentEvents(doc: Document) {
    doc.on(DocumentEvents.Expanded, this.handleExpanded);
    doc.on(DocumentEvents.Collapsed, this.handleCollapsed);
  }

  /**
   * Unsubscribe from the document events.
   */
  unsubscribeFromDocumentEvents(doc: Document) {
    doc.off(DocumentEvents.Expanded, this.handleExpanded);
    doc.off(DocumentEvents.Collapsed, this.handleCollapsed);
  }

  handleExpanded = () => {
    this.setState({ expanded: true });
  };

  handleCollapsed = () => {
    this.setState({ expanded: false });
  };

  handleClone = () => {
    const clonedDoc = this.props.doc.generateObject({
      excludeInternalFields: true,
    });
    this.props.openInsertDocumentDialog?.(clonedDoc, true);
  };

  /**
   * Handle copying JSON to clipboard of the document.
   */
  handleCopy = () => {
    this.props.copyToClipboard?.(this.props.doc);
  };

  /**
   * Handle clicking the expand all button.
   */
  handleExpandAll = () => {
    const { doc } = this.props;
    // Update the doc directly - the components internal state will update via events
    if (doc.expanded) {
      doc.collapse();
    } else {
      doc.expand();
    }
  };

  /**
   * Get the elements for the document.
   *
   * @returns {Array} The elements.
   */
  renderElements(options?: {
    visibleRootElementSlice?: [number, number];
    lineNumberCounterStart?: number;
    showVisibleFieldsToggle?: boolean;
    extraGutterWidth?: number;
  }) {
    const {
      visibleRootElementSlice,
      lineNumberCounterStart,
      showVisibleFieldsToggle,
      extraGutterWidth = spacing[900],
    } = options ?? {};
    return (
      <>
        <DocumentList.Document
          value={this.props.doc}
          extraGutterWidth={extraGutterWidth}
          onUpdateQuery={this.props.onUpdateQuery}
          query={this.props.query}
          visibleRootElementSlice={visibleRootElementSlice}
          lineNumberCounterStart={lineNumberCounterStart}
          showVisibleFieldsToggle={showVisibleFieldsToggle}
        />
      </>
    );
  }

  renderActions(options?: {
    layout?: 'overlay' | 'gutter';
    onlyShowOnHover?: boolean;
  }) {
    const { layout = 'overlay', onlyShowOnHover } = options ?? {};
    const resolvedOnlyShowOnHover =
      onlyShowOnHover ??
      (layout === 'gutter'
        ? false
        : !this.props.stickyDocumentHeaderInScrollContainer);
    return (
      <DocumentList.DocumentActionsGroup
        layout={layout}
        onCopy={this.props.copyToClipboard ? this.handleCopy : undefined}
        onClone={
          this.props.openInsertDocumentDialog ? this.handleClone : undefined
        }
        onExpand={this.handleExpandAll}
        expanded={this.state.expanded}
        onlyShowOnHover={resolvedOnlyShowOnHover}
        insights={
          this.props.showInsights
            ? getInsightsForDocument(this.props.doc)
            : undefined
        }
      />
    );
  }

  /**
   * Render a single document list item.
   *
   * @returns {React.Component} The component.
   */
  render() {
    if (this.props.stickyDocumentHeaderInScrollContainer) {
      return (
        <div
          className={cx(documentStyles, stickyPreviewRowStyles)}
          data-testid="readonly-document"
        >
          <StickyPreviewGutter>
            {this.renderActions({ layout: 'gutter' })}
          </StickyPreviewGutter>
          <div className={stickyPreviewDocumentScrollStyles}>
            <div className={documentContentStyles}>
              {this.renderElements({ extraGutterWidth: spacing[200] })}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={documentStyles} data-testid="readonly-document">
        <div className={documentContentStyles}>
          {this.renderElements()}
          {this.renderActions()}
        </div>
      </div>
    );
  }

  static displayName = 'ReadonlyDocument';
}

export default withPreferences(ReadonlyDocument, ['showInsights']);
