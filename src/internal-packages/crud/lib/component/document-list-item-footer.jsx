'use strict';

const React = require('react');

/**
 * Component for the document footer.
 */
class DocumentListItemFooter extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
  }

  /**
   * Render a single document list item.
   */
  render() {
    return (
      <div className='document-footer'>
        <div className='edit-message'></div>
        <div className='document-actions'>
          <button className='cancel-document-edit' type='button'>Cancel</button>
          <button className='update-document' type='button'>Update</button>
        </div>
      </div>
    );
  }

}

DocumentListItemFooter.displayName = 'DocumentListItemFooter';

module.exports = DocumentListItemFooter;
