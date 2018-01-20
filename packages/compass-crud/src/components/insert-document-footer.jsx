const React = require('react');
const PropTypes = require('prop-types');

/**
 * BEM prefix.
 */
const PREFIX = 'document-footer';

/**
 * Map of modes to styles.
 */
const MODES = {
  progress: 'is-in-progress',
  error: 'is-error',
  modifying: 'is-modifying'
};

/**
 * Component for the insert document footer.
 */
class InsertDocumentFooter extends React.Component {

  /**
   * Get the style of the footer based on the current mode.
   *
   * @returns {String} The style.
   */
  style() {
    return `${PREFIX} ${PREFIX}-${MODES[this.props.mode]}`;
  }

  /**
   * Render the footer.
   *
   * @returns {Component} The footer component.
   */
  render() {
    return (
      <div className={this.style()}>
        <div className="document-footer-message" title={this.props.message}>
          {this.props.message}
        </div>
      </div>
    );
  }
}

InsertDocumentFooter.displayName = 'InsertDocumentFooter';

InsertDocumentFooter.propTypes = {
  message: PropTypes.string.isRequired,
  mode: PropTypes.string.isRequired
};

module.exports = InsertDocumentFooter;
