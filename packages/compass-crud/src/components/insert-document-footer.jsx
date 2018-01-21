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
const InsertDocumentFooter = (props) => (
  <div className={`${PREFIX} ${PREFIX}-${MODES[props.mode]}`}>
    <div className="document-footer-message" title={props.message}>
      {props.message}
    </div>
  </div>
);

InsertDocumentFooter.displayName = 'InsertDocumentFooter';

InsertDocumentFooter.propTypes = {
  message: PropTypes.string.isRequired,
  mode: PropTypes.string.isRequired
};

module.exports = InsertDocumentFooter;
