const React = require('react');
const PropTypes = require('prop-types');
// const _ = require('lodash');
const util = require('util');
const { Element } = require('hadron-document');
const HadronDocument = require('hadron-document');
const MESSAGE = {
  modified: 'Document Modified',
  editing: '',
  updated: 'Document Updated',
  deleted: 'Document Flagged For Deletion'
};

/**
 * Renders the update/cancel footer for a document.
 */
class EditingFooter extends React.Component {
  constructor(props) {
    super(props);
    props.api.selectAll();

    this.doc = props.data.hadronDocument;

    this.state = {
      mode: props.data.state
    };

    this.handleCancel = this.handleCancel.bind(this);
    this.handleUpdate = this.handleUpdate.bind(this);

  }
  componentDidMount() {
    this.unsubscribeEdited = this.handleDocEdited.bind(this);
    this.doc.on(Element.Events.Edited, this.unsubscribeEdited);
  }

  componentWillUnmount() {
    this.doc.removeListener(Element.Events.Edited, this.unsubscribeEdited);
  }

  handleDocEdited() {
    console.log("doc edited");
    this.props.node.data.state = 'modified';
    this.setState({mode: 'modified'});
  }

  handleCancel() {
    console.log("cancel");
  }

  handleUpdate() {
    console.log("update");
  }

  render() {
    const modeName = `update-bar-row-${this.state.mode}`;
    return (
      <div className={modeName}>
        <span className="update-bar-row-message">{MESSAGE[this.state.mode]}</span>
        <button
          className="update-bar-row-button"
          type="button"
          onClick={this.handleCancel}>Cancel</button>
        <button
          className="update-bar-row-button"
          type="button"
          onClick={this.handleUpdate}>Update</button>
      </div>
    );
  }
}

EditingFooter.propTypes = {
  api: PropTypes.any,
  value: PropTypes.any
};

EditingFooter.displayName = 'EditingFooter';

module.exports = EditingFooter;
