const React = require('react');
const PropTypes = require('prop-types');

// const EditingFooter = require('./editing-footer');
// const DeletingFooter = require('./deleting-footer');

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
    this.updateStore = {listen: ()=>{}};
    this.removeStore = {listen: ()=>{}};
  }

  handleCancelDelete() {

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
  mode: PropTypes.any
};

FullWidthCellRenderer.displayName = 'FullWidthCellRenderer';

module.exports = FullWidthCellRenderer;
