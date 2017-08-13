const React = require('react');
const PropTypes = require('prop-types');

/**
 * Represents the table view of the documents tab.
 */
class DocumentListTableView extends React.Component {

  /**
   * Render the document table view.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (<div></div>);
  }
}

DocumentListTableView.propTypes = {
  docs: PropTypes.array.isRequired,
  isEditable: PropTypes.bool.isRequired
};

DocumentListTableView.displayName = 'DocumentListTableView';

module.exports = DocumentListTableView;
