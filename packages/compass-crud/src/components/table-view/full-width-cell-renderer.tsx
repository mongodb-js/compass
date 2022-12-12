import React from 'react';
import PropTypes from 'prop-types';
import {
  DocumentList,
  LeafyGreenProvider,
} from '@mongodb-js/compass-components';
import type Document from 'hadron-document';
import type { CellEditorProps } from './cell-editor';
import type { GridActions } from '../../stores/grid-store';
import type { Element } from 'hadron-document';
import type { BSONObject, CrudActions } from '../../stores/crud-store';

export type FullWidthCellRendererProps = Pick<
  CellEditorProps,
  'context' | 'api' | 'node'
> & {
  data: CellEditorProps['node']['data'];
  cleanCols: GridActions['cleanCols'];
  replaceDoc: GridActions['replaceDoc'];
  replaceDocument: CrudActions['replaceDocument'];
  removeDocument: CrudActions['removeDocument'];
  updateDocument: CrudActions['updateDocument'];
  darkMode?: boolean;
};

type FullWidthCellRendererState = {
  mode: 'editing' | 'deleting' | undefined;
};

/**
 * The custom full-width cell renderer that renders the update/cancel bar
 * in the table view. Can either be a deleting or editing footer.
 *
 */
class FullWidthCellRenderer extends React.Component<
  FullWidthCellRendererProps,
  FullWidthCellRendererState
> {
  doc: Document;

  constructor(props: FullWidthCellRendererProps) {
    super(props);

    this.doc = props.data.hadronDocument;
    this.state = {
      mode: props.data.state,
    };
  }

  /**
   * Subscribe to the update store on mount.
   */
  componentDidMount() {
    this.doc.on('remove-success', this.handleRemoveSuccess);
    this.doc.on('update-success', this.handleUpdateSuccess);
  }

  /**
   * Unsubscribe from the update store on unmount.
   */
  componentWillUnmount() {
    this.doc.removeListener('remove-success', this.handleRemoveSuccess);
    this.doc.removeListener('update-success', this.handleUpdateSuccess);
  }

  /**
   * Handle a successful update.
   *
   * @param {Object} doc - The updated document.
   */
  handleUpdateSuccess = (doc: BSONObject) => {
    let check: BSONObject = doc;
    if (this.props.context.path.length) {
      for (let i = 0; i < this.props.context.path.length; i++) {
        check = (check as any)[this.props.context.path[i]];
      }
    }
    this.props.replaceDoc(
      this.doc.getStringId() as string,
      String(doc._id),
      check
    );

    this.props.context.handleUpdate(doc);
  };

  /**
   * Handle a successful update.
   */
  handleRemoveSuccess = () => {
    this.props.context.handleRemove(this.props.node);
  };

  handleCancelRemove() {
    this.props.api.stopEditing();
    this.props.context.removeFooter(this.props.node);
  }

  handleCancelUpdate() {
    this.props.api.stopEditing();
    const id = this.doc.getStringId() as string;

    let parent: Document | Element = this.doc;
    if (this.props.context.path.length) {
      parent = this.doc.getChild(this.props.context.path)!;
    }

    this.doc.cancel();
    this.props.context.removeFooter(this.props.node);

    if (parent) {
      let newDoc = parent.generateObject() as BSONObject;
      if (this.props.context.path.length && parent.elements === null) {
        newDoc = {};
      }
      this.props.replaceDoc(id, id, newDoc);
      this.props.cleanCols();
    }
  }

  refresh() {
    return true;
  }

  render() {
    return (
      // this is needed cause ag-grid renders this component outside
      // of the context chain
      <LeafyGreenProvider darkMode={this.props.darkMode}>
        <DocumentList.DocumentEditActionsFooter
          doc={this.doc}
          editing={this.state.mode === 'editing'}
          deleting={this.state.mode === 'deleting'}
          onUpdate={(force) => {
            this.props.api.stopEditing();
            if (force) {
              this.props.replaceDocument(this.doc);
            } else {
              this.props.updateDocument(this.doc);
            }
          }}
          onDelete={() => {
            this.props.api.stopEditing();
            this.props.removeDocument(this.doc);
          }}
          onCancel={() => {
            if (this.state.mode === 'editing') {
              this.handleCancelUpdate();
            } else {
              this.handleCancelRemove();
            }
          }}
        />
      </LeafyGreenProvider>
    );
  }

  static propTypes = {
    api: PropTypes.any,
    data: PropTypes.any,
    context: PropTypes.any,
    node: PropTypes.any,
    updateDocument: PropTypes.func.isRequired,
    removeDocument: PropTypes.func.isRequired,
    replaceDocument: PropTypes.func.isRequired,
    replaceDoc: PropTypes.func.isRequired,
    cleanCols: PropTypes.func.isRequired,
    darkMode: PropTypes.bool,
  };

  static displayName = 'FullWidthCellRenderer';
}

export default FullWidthCellRenderer;
