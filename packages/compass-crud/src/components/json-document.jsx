import React from 'react';
import PropTypes from 'prop-types';
import EditableJson from 'components/editable-json';

/**
 * Component for a single document in a list of documents.
 */
class JsonDocument extends React.Component {
  /**
   * Render a single document list item.
   *
   * @returns {React.Component} The component.
   */
  render() {
    // TODO: implement readonly mode
    if (this.props.editable) {
      return (<EditableJson {...this.props} />);
    }
  }
}

JsonDocument.displayName = 'Json';

JsonDocument.propTypes = {
  doc: PropTypes.object.isRequired,
  tz: PropTypes.string,
  editable: PropTypes.bool,
  expandAll: PropTypes.bool,
  removeJson: PropTypes.func,
  updateJson: PropTypes.func,
  openImportFileDialog: PropTypes.func,
  openInsertJsonDialog: PropTypes.func
};

export default JsonDocument;
