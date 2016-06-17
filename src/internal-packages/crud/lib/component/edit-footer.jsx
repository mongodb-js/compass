'use strict';

const React = require('react');
const Element = require('hadron-document').Element;

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
    this.state = { modified: false };
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
          {this.message()}
        </div>
        {this.actions()}
      </div>
    );
  }

  actions() {
    if (this.state.modified) {
      return (
        <div className='document-footer-actions'>
          <button className='cancel' type='button' onClick={this.handleCancel.bind(this)}>Cancel</button>
          <button className='update' type='button' onClick={this.handleUpdate.bind(this)}>Update</button>
        </div>
      );
    }
    return (
      <div className='document-footer-actions'></div>
    );
  }

  message() {
    return this.state.modified ? 'Document Modified' : '';
  }

  style() {
    return `document-footer${this.state.modified ? ' modified' : ''}`;
  }

  handleCancel() {
    this.setState({ modified: false });
  }

  handleUpdate() {
    console.log(this.props.doc.generateObject());
  }

  /**
   * Handle modification to the document.
   */
  handleModification() {
    this.setState({ modified: this.doc.isModified() });
  }
}

EditFooter.displayName = 'EditFooter';

module.exports = EditFooter;
