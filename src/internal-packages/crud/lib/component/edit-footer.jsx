'use strict';

const React = require('react');
const Element = require('hadron-document').Element;
const DocumentUpdateStore = require('../store/document-update-store');
const Actions = require('../actions');

/**
 * Component for a the edit document footer.
 */
class EditFooter extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.doc = props.doc;
    this.doc.on(Element.Events.Added, this.handleModification.bind(this));
    this.doc.on(Element.Events.Edited, this.handleModification.bind(this));
    this.doc.on(Element.Events.Removed, this.handleModification.bind(this));
    this.doc.on(Element.Events.Reverted, this.handleModification.bind(this));
    this.state = {
      modified: false,
      updating: false,
      updated: false,
      errored: false,
      message: ''
    };
  }

  handleDocumentUpdated(id, success, message) {
    console.log(id);
    console.log(success);
    console.log(message);
    console.log(this.doc.doc._id);
    if (id === this.doc.doc._id) {
      if (success) {
        this.setState({ updating: false, updated: true, message: 'Document Updated' });
      } else {
        this.setState({ updating: false, errored: true, message: message });
      }
    }
  }

  componentDidMount() {
    this.unsubscribe = DocumentUpdateStore.listen(this.handleDocumentUpdated.bind(this));
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  /**
   * Render the footer.
   *
   * @returns {Component} The footer component.
   */
  render() {
    return (
      <div className={this.style()}>
        <div className='edit-message'>
          {this.state.message}
        </div>
        {this.actions()}
      </div>
    );
  }

  actions() {
    if (this.state.modified) {
      return (
        <div className='document-footer-actions'>
          <button className='btn btn-link btn-xs cancel' type='button' onClick={this.handleCancel.bind(this)}>Cancel</button>
          <button className='btn btn-default btn-xs update' type='button' onClick={this.handleUpdate.bind(this)}>Update</button>
        </div>
      );
    }
    return (
      <div className='document-footer-actions'></div>
    );
  }

  style() {
    var style = 'document-footer';
    if (this.state.updating) {
      style = style.concat(' in-progress');
    } else if (this.state.updated) {
      style = style.concat(' success');
    } else if (this.state.errored) {
      style = style.concat(' error');
    } else if (this.state.modified) {
      style = style.concat(' modified');
    }
    return style;
  }

  handleCancel() {
    this.doc.cancel();
    this.setState({ modified: false });
  }

  handleUpdate() {
    var object = this.props.doc.generateObject();
    this.setState({ updating: true, errored: false, message: 'Updating document' });
    Actions.updateDocument(object);
  }

  /**
   * Handle modification to the document.
   */
  handleModification() {
    this.setState({ modified: this.doc.isModified(), errored: false, message: 'Document Modified' });
  }
}

EditFooter.displayName = 'EditFooter';

module.exports = EditFooter;
