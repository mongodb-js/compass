const React = require('react');
const PropTypes = require('prop-types');

const HadronDocument = require('hadron-document');

const DocumentFooter = require('../document-footer');
const RemoveDocumentFooter = require('../remove-document-footer');


/**
 * The custom full-width cell renderer that renders the update/cancel bar
 * in the table view. Can either be a deleting or an editing footer.
 *
 */
class FullWidthCellRenderer extends React.Component {
  constructor(props) {
    super(props);
    props.api.selectAll();

    this.doc = props.data.hadronDocument;
    this.state = {
      mode: props.data.state
    };

    this.actions = {update: ()=>{}, remove: ()=>{}};
    this.updateStore = {listen: ()=>{return ()=>{};}};
    this.removeStore = {listen: ()=>{return ()=>{};}};
  }

  componentDidMount() {
    this.unsubscribeCancel = this.closeFooter.bind(this);
    this.doc.on(HadronDocument.Events.Cancel, this.unsubscribeCancel);
  }

  componentWillUnmount() {
    this.doc.removeListener(HadronDocument.Events.Cancel, this.unsubscribeCancel);
  }

  closeFooter() {
    const api = this.props.api;
    const data = this.props.data;

    const rowId = data.hadronDocument.get('_id').value.toString() + '0';
    setTimeout(function() {
      api.getRowNode(rowId).data.hasFooter = false;
      api.getRowNode(rowId).data.state = null;
      api.updateRowData({remove: [data]});
    }, 0);
  }

  handleCancelDelete() {
    this.closeFooter();
  }

  render() {
    if (this.state.mode === 'editing') {
      return (
        <DocumentFooter
          doc={this.doc}
          updateStore={this.updateStore}
          actions={this.actions}
        />
      );
    }
    return (
      <RemoveDocumentFooter
        doc={this.doc}
        removeStore={this.removeStore}
        actions={this.actions}
        cancelHandler={this.handleCancelDelete.bind(this)} />
    );
  }

}

FullWidthCellRenderer.propTypes = {
  api: PropTypes.any,
  mode: PropTypes.any,
  data: PropTypes.any
};

FullWidthCellRenderer.displayName = 'FullWidthCellRenderer';

module.exports = FullWidthCellRenderer;
