import React from 'react';
import PropTypes from 'prop-types';
import { DocumentList, css, spacing } from '@mongodb-js/compass-components';
import type Document from 'hadron-document';
import type { TypeCastMap } from 'hadron-type-checker';
import { withPreferences } from 'compass-preferences-model/provider';
import { getInsightsForDocument } from '../utils';
import { DocumentEvents } from 'hadron-document';
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
  paddingTop: spacing[3],
  paddingBottom: spacing[3],
});

export type ReadonlyDocumentProps = {
  copyToClipboard?: (doc: Document) => void;
  openInsertDocumentDialog?: (doc: BSONObject, cloned: boolean) => void;
  doc: Document;
  showInsights?: boolean;
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
    doc.on(DocumentEvents.Expanded, this.handleExpanded);
    doc.on(DocumentEvents.Collapsed, this.handleCollapsed);
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
  renderElements() {
    return (
      <DocumentList.Document
        value={this.props.doc}
        // Provide extra whitespace for the expand button
        extraGutterWidth={spacing[900]}
      />
    );
  }

  renderActions() {
    return (
      <DocumentList.DocumentActionsGroup
        onCopy={this.props.copyToClipboard ? this.handleCopy : undefined}
        onClone={
          this.props.openInsertDocumentDialog ? this.handleClone : undefined
        }
        onExpand={this.handleExpandAll}
        expanded={this.state.expanded}
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

  static propTypes = {
    copyToClipboard: PropTypes.func,
    doc: PropTypes.object.isRequired,
    openInsertDocumentDialog: PropTypes.func,
    showInsights: PropTypes.bool,
  };
}

export default withPreferences(ReadonlyDocument, ['showInsights']);
