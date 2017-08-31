const React = require('react');
const PropTypes = require('prop-types');

const EditingFooter = require('./editing-footer');
const DeletingFooter = require('./deleting-footer');


/**
 * The custom full-width cell renderer that renders the update/cancel bar
 * in the table view. Can either be a deleting or an editing footer.
 *
 */
class FullWidthCellRenderer extends React.Component {
  constructor(props) {
    super(props);
    props.api.selectAll();
    this.mode = props.data.state;

  }

  renderEditing() {
    return (
      <EditingFooter {...this.props}/>
    );
  }

  renderDeleting() {
    return (
     <DeletingFooter {...this.props}/>
    )
  }

  render() {
    if (this.mode === 'editing') {
      return this.renderEditing()
    }
    return this.renderDeleting();
  }
}

FullWidthCellRenderer.propTypes = {
  api: PropTypes.any,
  mode: PropTypes.any
};

FullWidthCellRenderer.displayName = 'FullWidthCellRenderer';

module.exports = FullWidthCellRenderer;
